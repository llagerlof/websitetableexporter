document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('showButtonsCheckbox');

  function setCheckbox(visible) {
    checkbox.checked = Boolean(visible);
  }

  function loadGlobalSetting() {
    chrome.runtime.sendMessage({ action: 'getGlobalButtonsSetting' }, (response) => {
      if (chrome.runtime.lastError) {
        setCheckbox(true);
        return;
      }
      if (response && typeof response.buttonsVisible !== 'undefined') {
        setCheckbox(response.buttonsVisible);
      } else {
        setCheckbox(true);
      }
    });
  }

  checkbox.addEventListener('change', () => {
    const newValue = checkbox.checked;
    checkbox.disabled = true;
    chrome.runtime.sendMessage({ action: 'setGlobalButtonsSetting', buttonsVisible: newValue }, (resp) => {
      checkbox.disabled = false;
      if (chrome.runtime.lastError) {
        console.error('Error saving setting:', chrome.runtime.lastError);
        // revert UI if failed
        loadGlobalSetting();
      } else if (!resp || resp.ok !== true) {
        console.error('Error saving setting');
        loadGlobalSetting();
      }
    });
  });

  loadGlobalSetting();
});