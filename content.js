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

function showMessage(element, message, originalText) {
  element.textContent = message;
  setTimeout(() => {
    element.textContent = originalText;
  }, 1000);
}

document.querySelectorAll('table').forEach(table => {
  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('table-buttons-container');

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

  // Add buttons to container
  buttonContainer.appendChild(csvButton);
  buttonContainer.appendChild(jsonButton);
  buttonContainer.appendChild(markdownButton);

  // Position table and add container
  table.style.position = 'relative';
  table.insertBefore(buttonContainer, table.firstChild);

  // CSV button event listener
  csvButton.addEventListener('click', () => {
    const csvData = tableToCSV(table);
    navigator.clipboard.writeText(csvData).then(() => {
      showMessage(csvButton, 'Copied!', 'CSV');
    });
  });

  // JSON button event listener
  jsonButton.addEventListener('click', () => {
    const jsonData = tableToJSON(table);
    navigator.clipboard.writeText(jsonData).then(() => {
      showMessage(jsonButton, 'Copied!', 'JSON');
    });
  });

  // Markdown button event listener
  markdownButton.addEventListener('click', () => {
    const markdownData = tableToMarkdown(table);
    navigator.clipboard.writeText(markdownData).then(() => {
      showMessage(markdownButton, 'Copied!', 'Markdown');
    });
  });
});