# Website Table Exporter

A browser extension that automatically adds export functionality to HTML tables on any website. Export tables to CSV, JSON, or Markdown format with a single click.

![Website Table Exporter Screenshot](./assets/screenshot.png)

## ✨ Features

- **Universal compatibility**: Works on any website with HTML tables.
- **Multiple export formats**: CSV, JSON, and Markdown.
- **One-click export**: Export buttons appear automatically on all tables, even those dynamically created after page load.
- **Data type detection**: Automatically identifies columns that contain only numeric values (don't enclose those in quotes). Also identifies columns with values containing leading zeros (enclose those in quotes).
- **Clean formatting**: Properly handles line breaks, special characters, and HTML tags inside cells.
- **Privacy**: The extension is fully client-side. No ads, no tracking.
- **Toggle button visibility**: Single checkbox in the popup to show/hide export buttons, persisted across tabs and sessions.
- **Clipboard integration**: Exported data is copied directly to your clipboard.
- **Merged cell detection**: Warns users when tables contain merged cells that may affect export quality.


### Example Output

**CSV Format:**
```
"Name","Age","City"
"John Doe",30,"New York"
"Jane Smith",25,"Los Angeles"
```

**JSON Format:**
```json
[
  {
    "Name": "John Doe",
    "Age": 30,
    "City": "New York"
  },
  {
    "Name": "Jane Smith",
    "Age": 25,
    "City": "Los Angeles"
  }
]
```

**Markdown Format:**
```markdown
| Name | Age | City |
| --- | --- | --- |
| John Doe | 30 | New York |
| Jane Smith | 25 | Los Angeles |
```

## 🚀 Installation

### Mozilla Firefox

1. **Install from Firefox Add-ons**:
   - https://addons.mozilla.org/firefox/addon/website-table-exporter/

2. **Manual Installation** (for development):
   - Download or clone this repository
   - Build once, then load from the built folder
     - Install deps and build: `npm install` then `npm run build`
     - Open Firefox and navigate to `about:debugging`
     - Click "This Firefox" in the left sidebar
     - Click "Load Temporary Add-on"
     - Select the `manifest.json` inside `./dist/firefox/`
   - Note: Temporary add-ons must be reloaded after restarting Firefox

### Google Chrome

1. **Manual Installation**:
   - Download or clone this repository
   - Build once, then load from the built folder
     - Install deps and build: `npm install` then `npm run build`
     - Open Chrome and navigate to `chrome://extensions/`
     - Enable "Developer mode" (toggle in top right)
     - Click "Load unpacked" and select `./dist/chrome/`

## 🛠️ Build from source

The project includes a simple build script that prepares unpacked folders for each browser and ZIP files ready for store submission.

Requirements:
- Node.js >= 16

Steps:
1. Install dependencies:
   - `npm install`
2. Run the build:
   - `npm run build`
3. Output:
   - Unpacked builds:
     - `./dist/chrome/` (Manifest V3)
     - `./dist/firefox/` (with Firefox-compatible manifest)
   - ZIP archives:
     - `./dist/websitetableexporter-chrome-v<version>.zip`
     - `./dist/websitetableexporter-firefox-v<version>.zip`

## 📖 How to Use

### Basic Export Functionality
1. **Navigate to any webpage** containing HTML tables
2. **Export buttons appear automatically** on each table:
   - **CSV**: Export as comma-separated values
   - **JSON**: Export as JSON array with header-based keys
   - **Markdown**: Export as Markdown table format
3. **Click any export button** to copy the data to your clipboard
4. **Paste the data** into your preferred application

### Toggle Button Visibility
1. **Click the extension icon** in your browser's toolbar to open the popup
2. Use the checkbox **"Show export buttons on tables"** (enabled by default)
   - When checked, export buttons are shown on tables across all tabs
   - When unchecked, export buttons are hidden across all tabs
3. The setting is **persisted** and **synchronized**: switching tabs or focusing a different window will apply the latest setting to that tab automatically

## 🎯 Use Cases

- **Data Analysis**: Quickly export website tables for analysis in Excel, Google Sheets, or other tools
- **Documentation**: Convert HTML tables to Markdown for documentation or README files
- **Research**: Extract data from research papers, reports, or statistical websites
- **Content Migration**: Move tabular data between different platforms and formats
- **API Development**: Export table data as JSON for testing or development purposes
- **Academic Work**: Extract data from academic databases and online resources

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📝 License

This project is open source. Please check the license file for more details.

**Project page** (this page): https://github.com/llagerlof/websitetableexporter

---


*Made with ❤️ for developers, researchers, and data enthusiasts*
