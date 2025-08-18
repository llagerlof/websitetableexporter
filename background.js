// Background service worker for global settings and tab coordination

const DB_NAME = 'WebsiteTableExporterExtensionDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';
const VISIBILITY_KEY = 'buttonVisibility';

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('key', 'key', { unique: true });
      }
    };
  });
}

async function saveSetting(key, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function loadSetting(key, defaultValue) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      resolve(req.result ? req.result.value : defaultValue);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getGlobalVisibility() {
  return await loadSetting(VISIBILITY_KEY, true);
}

async function setGlobalVisibility(visible) {
  await saveSetting(VISIBILITY_KEY, Boolean(visible));
}

async function broadcastVisibilityToAllTabs() {
  const visible = await getGlobalVisibility();
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'applyButtonsState', buttonsVisible: visible });
      }
    }
  });
}

async function pushVisibilityToActiveTab(windowId) {
  const visible = await getGlobalVisibility();
  chrome.tabs.query({ active: true, windowId: windowId ?? chrome.windows.WINDOW_ID_CURRENT }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'applyButtonsState', buttonsVisible: visible });
    }
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  // Ensure default is set
  const current = await loadSetting(VISIBILITY_KEY, undefined);
  if (typeof current === 'undefined') {
    await setGlobalVisibility(true);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  // Optional: push current state to all tabs on startup
  await broadcastVisibilityToAllTabs();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await pushVisibilityToActiveTab(activeInfo.windowId);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    await pushVisibilityToActiveTab(windowId);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'getGlobalButtonsSetting') {
    getGlobalVisibility()
      .then((visible) => sendResponse({ buttonsVisible: Boolean(visible) }))
      .catch(() => sendResponse({ buttonsVisible: true }));
    return true;
  }
  if (request && request.action === 'setGlobalButtonsSetting') {
    const newValue = Boolean(request.buttonsVisible);
    setGlobalVisibility(newValue)
      .then(() => {
        // Broadcast update
        broadcastVisibilityToAllTabs();
        sendResponse({ ok: true });
      })
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});


