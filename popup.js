document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');

  // Get current state from the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getButtonsState'}, function(response) {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet, assume buttons are visible
        updateButtonText(true);
      } else if (response) {
        updateButtonText(response.buttonsVisible);
      } else {
        updateButtonText(true);
      }
    });
  });

  toggleButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleButtons'}, function(response) {
        if (response) {
          updateButtonText(response.buttonsVisible);
        }
      });
    });
  });

  function updateButtonText(buttonsVisible) {
    toggleButton.textContent = buttonsVisible ? 'Hide buttons' : 'Show buttons';
  }
});