// IndexedDB utility functions for storing extension settings
const DB_NAME = 'WebsiteTableExporterDB';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

// Initialize IndexedDB
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

// Save a setting to IndexedDB
async function saveSetting(key, value) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put({ key: key, value: value });
    return true;
  } catch (error) {
    console.error('Error saving setting:', error);
    return false;
  }
}

// Load a setting from IndexedDB
async function loadSetting(key, defaultValue = null) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
    });
  } catch (error) {
    console.error('Error loading setting:', error);
    return defaultValue;
  }
}

// Global variable to track button visibility - will be loaded from storage
let buttonsVisible = true;

// Initialize settings from storage
async function initializeSettings() {
  buttonsVisible = await loadSetting('buttonVisibility', true);

  // Apply the loaded state to any existing buttons
  const allButtonContainers = document.querySelectorAll('.table-buttons-container');
  allButtonContainers.forEach(container => {
    if (buttonsVisible) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  });
}

// Utility function to generate unique IDs
function generateUniqueId() {
  return 'table-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Function to position button container relative to its table
function positionButtonContainer(buttonContainer, table) {
  if (!buttonContainer.parentElement || !table) return;

  const tableRect = table.getBoundingClientRect();
  const containerParent = buttonContainer.parentElement;

  // Check if the container parent has a positioned context
  const parentComputedStyle = window.getComputedStyle(containerParent);
  const isParentPositioned = ['relative', 'absolute', 'fixed'].includes(parentComputedStyle.position);

  if (!isParentPositioned) {
    // If parent is not positioned, use fixed positioning relative to viewport
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.left = tableRect.left + 'px';
    buttonContainer.style.top = tableRect.top + 'px';
  } else {
    // If parent is positioned, use absolute positioning relative to parent
    const parentRect = containerParent.getBoundingClientRect();
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.left = (tableRect.left - parentRect.left) + 'px';
    buttonContainer.style.top = (tableRect.top - parentRect.top) + 'px';
  }
}

// Helper function to check if a value is a valid number
function isNumericValue(value) {
  if (!value || value.trim() === '') return false;
  const trimmed = value.trim();

  // Remove common currency symbols and formatting
  const cleaned = trimmed.replace(/[$€£¥₹₩₪₦₨₱₪₡₵₸₼₾₰₲₴₶₷₸₹₺₻₽₾₿]/g, '') // Currency symbols
                        .replace(/[,\s]/g, '') // Commas and spaces
                        .replace(/^\(/, '-') // Negative numbers in parentheses
                        .replace(/\)$/, ''); // Close parenthesis for negative numbers

  // Check for valid number formats including integers, decimals, and scientific notation
  return !isNaN(cleaned) && !isNaN(parseFloat(cleaned)) && isFinite(cleaned) && cleaned !== '';
}

// Helper function to convert a formatted number string to a numeric value
function parseNumericValue(value) {
  if (!value || value.trim() === '') return 0;
  const trimmed = value.trim();

  // Handle negative numbers in parentheses
  let isNegative = false;
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    isNegative = true;
  }

  // Remove common currency symbols and formatting
  const cleaned = trimmed.replace(/[$€£¥₹₩₪₦₨₱₪₡₵₸₼₾₰₲₴₶₷₸₹₺₻₽₾₿]/g, '') // Currency symbols
                        .replace(/[,\s]/g, '') // Commas and spaces
                        .replace(/^\(/, '') // Open parenthesis
                        .replace(/\)$/, ''); // Close parenthesis

  const numericValue = parseFloat(cleaned);
  return isNegative ? -numericValue : numericValue;
}

// Function to analyze table columns and identify which ones are numeric
function analyzeTableColumns(table) {
  const numericColumns = new Set();

  if (table.rows.length <= 1) return numericColumns; // No data rows to analyze

  // Get the number of columns from the first row
  const firstRow = table.rows[0];
  const numColumns = firstRow.cells.length;

    // Check each column
  for (let colIndex = 0; colIndex < numColumns; colIndex++) {
    let hasValues = false;
    let allNumeric = true;
    let hasLeadingZeros = false;

    // Check all data rows (skip header row)
    for (let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
      const row = table.rows[rowIndex];
      if (colIndex < row.cells.length) {
        const cellText = row.cells[colIndex].innerText.trim();

        // Skip empty cells
        if (cellText !== '') {
          hasValues = true;

          // Check for leading zeros in integers (but allow decimals like '0.5')
          if (cellText.startsWith('0') && cellText.length > 1 && !cellText.includes('.')) {
            hasLeadingZeros = true;
          }

          if (!isNumericValue(cellText)) {
            allNumeric = false;
            break;
          }
        }
      }
    }

    // Column is numeric if it has values, all non-empty values are numeric, and no leading zeros in integers
    if (hasValues && allNumeric && !hasLeadingZeros) {
      numericColumns.add(colIndex);
    }
  }

  return numericColumns;
}

function tableToCSV(table) {
  let csv = [];
  const numericColumns = analyzeTableColumns(table);

  for (let i = 0; i < table.rows.length; i++) {
    let row = [], cols = table.rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      let cellText = cols[j].innerText.trim();

      // For header row (i === 0) or non-numeric columns, always quote
      if (i === 0 || !numericColumns.has(j) || !isNumericValue(cellText)) {
        let escapedText = cellText.replace(/"/g, '""');
        row.push(`"${escapedText}"`);
      } else {
        // For numeric values in numeric columns, don't quote and use cleaned numeric value
        const numericValue = parseNumericValue(cellText);
        row.push(numericValue.toString());
      }
    }
    csv.push(row.join(','));
  }
  return csv.join('\n');
}

function tableToJSON(table) {
  let jsonData = [];
  let headers = [];
  const numericColumns = analyzeTableColumns(table);

  // Get headers from the first row
  let headerRow = table.rows[0];
  if (headerRow) {
    for (let j = 0; j < headerRow.cells.length; j++) {
      headers.push(headerRow.cells[j].innerText.trim());
    }
  }

  // Process data rows (skip header row)
  for (let i = 1; i < table.rows.length; i++) {
    let rowData = {};
    let cols = table.rows[i].querySelectorAll('td, th');

    for (let j = 0; j < cols.length; j++) {
      let cellText = cols[j].innerText.trim();
      let header = headers[j] || `Column${j + 1}`;

      // Convert to number if this column is numeric and the value is numeric
      if (numericColumns.has(j) && isNumericValue(cellText)) {
        rowData[header] = parseNumericValue(cellText);
      } else {
        rowData[header] = cellText;
      }
    }

    jsonData.push(rowData);
  }

  return JSON.stringify(jsonData, null, 2);
}

function tableToMarkdown(table) {
  let markdown = [];

  if (table.rows.length === 0) return '';

  // Get headers from the first row
  let headerRow = table.rows[0];
  let headers = [];
      for (let j = 0; j < headerRow.cells.length; j++) {
      let cellText = headerRow.cells[j].innerText.trim();
      // Replace line breaks with <br> tags for markdown (supports Windows \r\n, Unix \n, and Mac \r)
      cellText = cellText.replace(/\r\n|\r|\n/g, '<br>');
      // Escape pipe characters in markdown
      cellText = cellText.replace(/\|/g, '\\|');
      headers.push(cellText);
    }

  // Create header row
  markdown.push('| ' + headers.join(' | ') + ' |');

  // Create separator row
  let separators = headers.map(() => '---');
  markdown.push('| ' + separators.join(' | ') + ' |');

  // Process data rows (skip header row)
  for (let i = 1; i < table.rows.length; i++) {
    let row = [];
    let cols = table.rows[i].querySelectorAll('td, th');

    for (let j = 0; j < cols.length; j++) {
      let cellText = cols[j].innerText.trim();
      // Replace line breaks with <br> tags for markdown (supports Windows \r\n, Unix \n, and Mac \r)
      cellText = cellText.replace(/\r\n|\r|\n/g, '<br>');
      // Escape pipe characters in markdown
      cellText = cellText.replace(/\|/g, '\\|');
      row.push(cellText);
    }

    // Pad row to match header length
    while (row.length < headers.length) {
      row.push('');
    }

    markdown.push('| ' + row.join(' | ') + ' |');
  }

  return markdown.join('\n');
}

function hasMergedCells(table) {
  // Check all cells in the table for colspan or rowspan attributes
  const cells = table.querySelectorAll('td, th');
  for (let cell of cells) {
    const colspan = cell.getAttribute('colspan');
    const rowspan = cell.getAttribute('rowspan');
    if ((colspan && parseInt(colspan) > 1) || (rowspan && parseInt(rowspan) > 1)) {
      return true;
    }
  }
  return false;
}

function createWarningMessage(buttonContainer) {
  const warningDiv = document.createElement('div');
  warningDiv.classList.add('merged-cells-warning');
  warningDiv.innerHTML = `
    <span class="warning-icon">⚠️</span>
    <span class="warning-text">Copied, but the table contains merged cells. Exported data may be unreliable due to limitations of the destination format.</span>
    <button class="warning-close-btn">×</button>
  `;

  // Add close button functionality
  const closeBtn = warningDiv.querySelector('.warning-close-btn');
  closeBtn.addEventListener('click', () => {
    warningDiv.remove();
  });

  // Position warning as a sibling to button container, not as a child
  // This prevents it from inheriting the container's opacity
  if (buttonContainer.parentNode) {
    buttonContainer.parentNode.insertBefore(warningDiv, buttonContainer.nextSibling);

    // Position the warning relative to the button container
    const containerRect = buttonContainer.getBoundingClientRect();
    const parentRect = buttonContainer.parentNode.getBoundingClientRect();

    warningDiv.style.position = buttonContainer.style.position; // Use same positioning as container
    warningDiv.style.left = buttonContainer.style.left;
    warningDiv.style.top = (parseInt(buttonContainer.style.top) + buttonContainer.offsetHeight + 2) + 'px';
  }

  return warningDiv;
}

function showMessage(element, message, originalText) {
  element.textContent = message;
  setTimeout(() => {
    element.textContent = originalText;
  }, 1000);
}

// Function to toggle all table buttons visibility
async function toggleAllButtons() {
  buttonsVisible = !buttonsVisible;
  const allButtonContainers = document.querySelectorAll('.table-buttons-container');

  allButtonContainers.forEach(container => {
    if (buttonsVisible) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  });

  // Save the new state to IndexedDB
  await saveSetting('buttonVisibility', buttonsVisible);

  return buttonsVisible;
}

// Function to add buttons to a single table
function addButtonsToTable(table) {
  // Skip if table already has buttons
  if (table.nextElementSibling && table.nextElementSibling.classList.contains('table-buttons-container')) {
    return;
  }

  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('table-buttons-container');

  // Apply current visibility state
  if (!buttonsVisible) {
    buttonContainer.classList.add('hidden');
  }

  // Create button row to hold the buttons
  const buttonRow = document.createElement('div');
  buttonRow.classList.add('button-row');

  // Create CSV button
  const csvButton = document.createElement('div');
  csvButton.textContent = 'CSV';
  csvButton.classList.add('table-button', 'csv-button');

  // Create JSON button
  const jsonButton = document.createElement('div');
  jsonButton.textContent = 'JSON';
  jsonButton.classList.add('table-button', 'json-button');

  // Create Markdown button
  const markdownButton = document.createElement('div');
  markdownButton.textContent = 'Markdown';
  markdownButton.classList.add('table-button', 'markdown-button');

  // Add buttons to button row
  buttonRow.appendChild(csvButton);
  buttonRow.appendChild(jsonButton);
  buttonRow.appendChild(markdownButton);

  // Add button row to container
  buttonContainer.appendChild(buttonRow);

  // Position the button container as a sibling, not as a child of the table
  // This prevents any interference with table layout
  if (table.parentNode) {
    table.parentNode.insertBefore(buttonContainer, table.nextSibling);
  }

  // Store reference to the table for positioning
  buttonContainer.setAttribute('data-table-id', generateUniqueId());
  table.setAttribute('data-table-id', buttonContainer.getAttribute('data-table-id'));

  // Position the button container
  positionButtonContainer(buttonContainer, table);

  // CSV button event listener
  csvButton.addEventListener('click', () => {
    const csvData = tableToCSV(table);
    navigator.clipboard.writeText(csvData).then(() => {
      showMessage(csvButton, 'Copied!', 'CSV');

      // Show warning if table has merged cells
      if (hasMergedCells(table)) {
        // Remove any existing warning (look for siblings)
        let existingWarning = buttonContainer.nextElementSibling;
        while (existingWarning && !existingWarning.classList.contains('merged-cells-warning')) {
          existingWarning = existingWarning.nextElementSibling;
        }
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
      }
    });
  });

  // JSON button event listener
  jsonButton.addEventListener('click', () => {
    const jsonData = tableToJSON(table);
    navigator.clipboard.writeText(jsonData).then(() => {
      showMessage(jsonButton, 'Copied!', 'JSON');

      // Show warning if table has merged cells
      if (hasMergedCells(table)) {
        // Remove any existing warning (look for siblings)
        let existingWarning = buttonContainer.nextElementSibling;
        while (existingWarning && !existingWarning.classList.contains('merged-cells-warning')) {
          existingWarning = existingWarning.nextElementSibling;
        }
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
      }
    });
  });

  // Markdown button event listener
  markdownButton.addEventListener('click', () => {
    const markdownData = tableToMarkdown(table);
    navigator.clipboard.writeText(markdownData).then(() => {
      showMessage(markdownButton, 'Copied!', 'Markdown');

      // Show warning if table has merged cells
      if (hasMergedCells(table)) {
        // Remove any existing warning (look for siblings)
        let existingWarning = buttonContainer.nextElementSibling;
        while (existingWarning && !existingWarning.classList.contains('merged-cells-warning')) {
          existingWarning = existingWarning.nextElementSibling;
        }
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
      }
    });
  });
}

// Function to process all tables on the page
function processAllTables() {
  document.querySelectorAll('table').forEach(addButtonsToTable);
}

// Function to reposition a warning message relative to its button container
function repositionWarningMessage(warning, buttonContainer) {
  if (!warning || !buttonContainer || !buttonContainer.parentNode) return;

  warning.style.position = buttonContainer.style.position;
  warning.style.left = buttonContainer.style.left;
  warning.style.top = (parseInt(buttonContainer.style.top) + buttonContainer.offsetHeight + 2) + 'px';
}

// Function to reposition all button containers
function repositionAllButtons() {
  document.querySelectorAll('.table-buttons-container').forEach(buttonContainer => {
    const tableId = buttonContainer.getAttribute('data-table-id');
    const table = document.querySelector(`table[data-table-id="${tableId}"]`);
    if (table) {
      positionButtonContainer(buttonContainer, table);

      // Also reposition any associated warning messages
      let warning = buttonContainer.nextElementSibling;
      while (warning && !warning.classList.contains('merged-cells-warning')) {
        warning = warning.nextElementSibling;
      }
      if (warning) {
        repositionWarningMessage(warning, buttonContainer);
      }
    } else {
      // Clean up orphaned button containers and their warnings
      let warning = buttonContainer.nextElementSibling;
      while (warning && !warning.classList.contains('merged-cells-warning')) {
        warning = warning.nextElementSibling;
      }
      if (warning) {
        warning.remove();
      }
      buttonContainer.remove();
    }
  });
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleButtons') {
    toggleAllButtons().then(newState => {
      sendResponse({buttonsVisible: newState});
    });
    return true; // Indicates we will send a response asynchronously
  } else if (request.action === 'getButtonsState') {
    sendResponse({buttonsVisible: buttonsVisible});
  }
});

// Initialize settings and then process tables
initializeSettings().then(() => {
  processAllTables();
});

// Add event listeners for repositioning buttons on scroll and resize
let repositionTimeout;
function debounceReposition() {
  clearTimeout(repositionTimeout);
  repositionTimeout = setTimeout(repositionAllButtons, 10);
}

window.addEventListener('scroll', debounceReposition, { passive: true });
window.addEventListener('resize', debounceReposition, { passive: true });

// Create MutationObserver to watch for dynamically added tables
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    // Check for added nodes
    mutation.addedNodes.forEach((node) => {
      // If the added node is a table, add buttons to it
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TABLE') {
        addButtonsToTable(node);
      }

      // If the added node contains tables, add buttons to them
      if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
        node.querySelectorAll('table').forEach(addButtonsToTable);
      }
    });
  });
});

// Start observing the document for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});