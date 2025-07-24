document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');

  // Function to get current state with retry mechanism
  function getCurrentState(retryCount = 0) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getButtonsState'}, function(response) {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded yet or settings not initialized
          if (retryCount < 3) {
            // Retry after a short delay
            setTimeout(() => getCurrentState(retryCount + 1), 100);
          } else {
            // Give up and assume buttons are visible
            updateButtonText(true);
          }
        } else if (response) {
          updateButtonText(response.buttonsVisible);
        } else {
          updateButtonText(true);
        }
      });
    });
  }

  // Get current state on popup open
  getCurrentState();

  toggleButton.addEventListener('click', function() {
    // Disable button temporarily to prevent double-clicks
    toggleButton.disabled = true;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleButtons'}, function(response) {
        toggleButton.disabled = false;

        if (chrome.runtime.lastError) {
          console.error('Error toggling buttons:', chrome.runtime.lastError);
        } else if (response) {
          updateButtonText(response.buttonsVisible);
        }
      });
    });
  });

  function updateButtonText(buttonsVisible) {
    toggleButton.textContent = buttonsVisible ? 'Hide buttons' : 'Show buttons';
  }
});