/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const os = require('os');
const fse = require('fs-extra');
const archiver = require('archiver');

async function readJson(filePath) {
  const raw = await fse.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  await fse.writeFile(filePath, json, 'utf8');
}

async function zipDirectory(sourceDir, outPath) {
  await fse.ensureDir(path.dirname(outPath));
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const chromeDir = path.join(distDir, 'chrome');
  const firefoxDir = path.join(distDir, 'firefox');

  const manifestPath = path.join(rootDir, 'manifest.json');
  const baseManifest = await readJson(manifestPath);
  const version = baseManifest.version || '0.0.0';

  // Clean dist
  await fse.remove(distDir);
  await fse.ensureDir(distDir);

  // Common copy filter to exclude build tooling
  const copyFilter = (src) => {
    const rel = path.relative(rootDir, src);
    if (!rel) return true;
    const excluded = [
      'node_modules',
      'dist',
      'scripts',
      '.git',
      '.github',
      '.gitignore',
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      'assets',
      'sample-table.html',
      'README.md',
      'LICENSE',
    ];
    return !excluded.some((p) => rel === p || rel.startsWith(p + path.sep));
  };

  let workDir;
  try {
    // Work in a temporary directory to avoid copying into itself
    workDir = await fse.mkdtemp(path.join(os.tmpdir(), 'wte-build-'));

    // Copy project contents to temp workDir, excluding tooling and build output
    await fse.copy(rootDir, workDir, { filter: copyFilter });

    // Build Chrome (manifest v3 as-is)
    await fse.ensureDir(chromeDir);
    await fse.copy(workDir, chromeDir);
    await writeJson(path.join(chromeDir, 'manifest.json'), baseManifest);

    // Build Firefox - adjust manifest for Firefox compatibility
    const firefoxManifest = JSON.parse(JSON.stringify(baseManifest));

    // Firefox (as of now) uses background.scripts not service_worker
    if (firefoxManifest.background && firefoxManifest.background.service_worker) {
      firefoxManifest.background = { scripts: ['background.js'] };
    }

    // Firefox does not support action.default_popup for MV2? It does. Keep as-is.
    // Ensure browser_specific_settings.gecko is present (id already exists in repo)
    firefoxManifest.browser_specific_settings = firefoxManifest.browser_specific_settings || {};
    firefoxManifest.browser_specific_settings.gecko = firefoxManifest.browser_specific_settings.gecko || {};

    await fse.ensureDir(firefoxDir);
    await fse.copy(workDir, firefoxDir);
    await writeJson(path.join(firefoxDir, 'manifest.json'), firefoxManifest);
  } finally {
    if (workDir) {
      await fse.remove(workDir);
    }
  }

  // Zip both builds
  const baseName = 'websitetableexporter';
  const chromeZip = path.join(distDir, `${baseName}-chrome-v${version}.zip`);
  const firefoxZip = path.join(distDir, `${baseName}-firefox-v${version}.zip`);

  await zipDirectory(chromeDir, chromeZip);
  await zipDirectory(firefoxDir, firefoxZip);

  console.log('Build complete.');
  console.log(`Chrome:  ${path.relative(rootDir, chromeZip)}`);
  console.log(`Firefox: ${path.relative(rootDir, firefoxZip)}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});


