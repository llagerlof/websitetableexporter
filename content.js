function tableToCSV(table) {
  let csv = [];
  for (let i = 0; i < table.rows.length; i++) {
    let row = [], cols = table.rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      let cellText = cols[j].innerText.trim();
      let escapedText = cellText.replace(/"/g, '""');
      row.push(`"${escapedText}"`);
    }
    csv.push(row.join(','));
  }
  return csv.join('\n');
}

function tableToJSON(table) {
  let jsonData = [];
  let headers = [];

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
      rowData[header] = cellText;
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

  return warningDiv;
}

function showMessage(element, message, originalText) {
  element.textContent = message;
  setTimeout(() => {
    element.textContent = originalText;
  }, 1000);
}

// Function to add buttons to a single table
function addButtonsToTable(table) {
  // Skip if table already has buttons
  if (table.querySelector('.table-buttons-container')) {
    return;
  }

  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('table-buttons-container');

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

  // Position table and add container
  table.style.position = 'relative';
  table.insertBefore(buttonContainer, table.firstChild);

  // CSV button event listener
  csvButton.addEventListener('click', () => {
    const csvData = tableToCSV(table);
    navigator.clipboard.writeText(csvData).then(() => {
      showMessage(csvButton, 'Copied!', 'CSV');

      // Show warning if table has merged cells
      if (hasMergedCells(table)) {
        // Remove any existing warning
        const existingWarning = table.querySelector('.merged-cells-warning');
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
        table.appendChild(warning);
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
        // Remove any existing warning
        const existingWarning = table.querySelector('.merged-cells-warning');
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
        table.appendChild(warning);
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
        // Remove any existing warning
        const existingWarning = table.querySelector('.merged-cells-warning');
        if (existingWarning) {
          existingWarning.remove();
        }

        const warning = createWarningMessage(buttonContainer);
        table.appendChild(warning);
      }
    });
  });
}

// Function to process all tables on the page
function processAllTables() {
  document.querySelectorAll('table').forEach(addButtonsToTable);
}

// Initialize buttons on existing tables
processAllTables();

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