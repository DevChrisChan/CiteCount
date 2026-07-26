function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(state.settings));
  updateSettingsUI();
  updateWordCount();
}

function toggleSetting(setting, value) {
  if (setting === 'simplifiedMode') {
    const previousValue = !!state.settings.simplifiedMode;
    const checkbox = document.getElementById('simplifiedMode');
    
    // Show restart modal with blur background
    showNotification(
      'The app requires a restart to ' + (value ? 'enable' : 'disable') + ' Simplified Mode.',
      true,
      () => {
        // User confirmed - apply the setting and changes
        state.settings[setting] = value;
        saveSettings();
        
        // Apply UI changes
        const sidebar = document.getElementById('file-sidebar');
        const citationsPanel = document.getElementById('citations-panel');
        const gutter = document.getElementById('gutter');
        
        if (value) {
          // Enable Simplified Mode - hide sidebar and right section
          if (sidebar) sidebar.style.display = 'none';
          if (citationsPanel) {
            citationsPanel.style.display = 'flex';
            // Hide all content except citations
            const generateCitationContainer = document.getElementById('generate-citation-container');
            const wordCountDetailsContainer = document.getElementById('word-count-details-container');
            const moreAppsContainer = document.getElementById('more-apps-container');
            const dictionaryContainer = document.getElementById('dictionary-container');
            const thesaurusContainer = document.getElementById('thesaurus-container');
            const pomodoroContainer = document.getElementById('pomodoro-container');
            const translateContainer = document.getElementById('translate-container');
            const notepadContainer = document.getElementById('notepad-container');
            const wordbankContainer = document.getElementById('wordbank-container');
            const scientificCalculatorContainer = document.getElementById('scientific-calculator-container');
            const graphingCalculatorContainer = document.getElementById('graphing-calculator-container');
            
            if (generateCitationContainer) generateCitationContainer.style.display = 'none';
            if (wordCountDetailsContainer) wordCountDetailsContainer.style.display = 'none';
            if (moreAppsContainer) moreAppsContainer.style.display = 'none';
            if (dictionaryContainer) dictionaryContainer.style.display = 'none';
            if (thesaurusContainer) thesaurusContainer.style.display = 'none';
            if (pomodoroContainer) pomodoroContainer.style.display = 'none';
            if (translateContainer) translateContainer.style.display = 'none';
            if (notepadContainer) notepadContainer.style.display = 'none';
            if (wordbankContainer) wordbankContainer.style.display = 'none';
            if (scientificCalculatorContainer) scientificCalculatorContainer.style.display = 'none';
            if (graphingCalculatorContainer) graphingCalculatorContainer.style.display = 'none';
            
            const panelTabSelector = document.getElementById('panel-tab-selector');
            const panelHeader = document.getElementById('panel-header');
            const moreToolsHeaderNav = document.getElementById('more-tools-header-nav');
            
            if (panelTabSelector) panelTabSelector.style.display = 'none';
            if (panelHeader) panelHeader.style.display = 'none';
            if (moreToolsHeaderNav) moreToolsHeaderNav.style.display = 'none';
          }
          if (gutter) gutter.style.display = 'none';
        } else {
          // Disable Simplified Mode - show sidebar and restore UI
          if (sidebar) sidebar.style.display = 'block';
          if (citationsPanel) {
            const panelTabSelector = document.getElementById('panel-tab-selector');
            const panelHeader = document.getElementById('panel-header');
            if (panelTabSelector) panelTabSelector.style.display = 'flex';
          }
          if (gutter) gutter.style.display = 'block';
        }
        
        // Refresh the page
        setTimeout(() => {
          window.location.reload();
        }, 300);
      },
      'confirmation',
      () => {
        // User cancelled - revert the toggle
        if (checkbox) checkbox.checked = previousValue;
        state.settings[setting] = previousValue;
        saveSettings();
      },
      {
        title: 'App Restart Required',
        confirmButton: 'Restart Now',
        cancelButton: 'Cancel'
      }
    );
    
    // Apply strong blur to overlay background
    setTimeout(() => {
      const overlay = document.getElementById('overlay-background');
      if (overlay) {
        overlay.style.backdropFilter = 'blur(8px)';
        overlay.style.WebkitBackdropFilter = 'blur(8px)';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      }
    }, 50);
    
    return;
  }
  state.settings[setting] = value;
  saveSettings();
  if (setting.startsWith('words') || setting.startsWith('chars') || setting === 'citations') {
    updateWordCount();
  }
  if (setting === 'spellCheck') {
    document.getElementById('editor').spellcheck = value;
  }
  if (setting === 'focus') {
    const afterAppContent = document.getElementById('after-app-placeholder');
    if (afterAppContent) {
      afterAppContent.style.display = value ? 'none' : 'block';
    }
  }
  if (setting === 'warnLeave') {
    updateBeforeUnloadHandler();
  }
  if (setting === 'autoSave') {
    updateBeforeUnloadHandler();
  }
}

function updateFontSize(size) {
  state.settings.fontSize = parseInt(size);
  saveSettings();
  updateSettingsUI();
}

function updateBeforeUnloadHandler() {
  if (state.settings.warnLeave && !state.settings.autoSave) {
    window.onbeforeunload = (e) => {
      // Restore previous settings if settings modal is open with invalid selection
      if (typeof restorePreviousSettings === 'function') {
        const overlay = document.getElementById('settings-overlay');
        if (overlay && overlay.classList.contains('open')) {
          if (typeof validateToolsSelection === 'function' && !validateToolsSelection()) {
            restorePreviousSettings();
          }
        }
      }
      
      if (document.getElementById('editor').innerText.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
  } else {
    window.onbeforeunload = (e) => {
      // Restore previous settings if settings modal is open with invalid selection (even when warnLeave is off)
      if (typeof restorePreviousSettings === 'function') {
        const overlay = document.getElementById('settings-overlay');
        if (overlay && overlay.classList.contains('open')) {
          if (typeof validateToolsSelection === 'function' && !validateToolsSelection()) {
            restorePreviousSettings();
          }
        }
      }
    };
  }
}

function updateFontFamily(family) {
  state.settings.fontFamily = family;
  saveSettings();
  updateSettingsUI();
}

function updateDefaultCitationStyle(style) {
  state.settings.defaultCitationStyle = style;
  localStorage.setItem('defaultCitationStyle', style);
  saveSettings();
  
  // Update the citation.js variable if it exists
  if (typeof currentCitationStyle !== 'undefined') {
    currentCitationStyle = style;
  }
}

function toggleFontFamilyDropdown() {
  const dropdown = document.getElementById('fontFamilyDropdown');
  dropdown.classList.toggle('hidden');
}

function selectFontFamily(value, displayName) {
  updateFontFamily(value);
  
  // Update button text and style
  const buttonText = document.getElementById('fontFamilyButtonText');
  buttonText.textContent = displayName;
  buttonText.style.fontFamily = value;
  
  // Close dropdown
  document.getElementById('fontFamilyDropdown').classList.add('hidden');
}

function updateSettingsUI() {
  for (let [key, value] of Object.entries(state.settings)) {
    const checkbox = document.getElementById(key);
    if (checkbox) checkbox.checked = value;
    
    // Handle range sliders
    const slider = document.getElementById(key + 'Slider');
    if (slider) slider.value = value;
    
    // Handle select dropdowns
    const select = document.getElementById(key + 'Select');
    if (select) select.value = value;
  }
  
  // Update font size display
  const fontSizeDisplay = document.getElementById('fontSizeDisplay');
  if (fontSizeDisplay) {
    fontSizeDisplay.textContent = state.settings.fontSize + 'px';
  }
  
  // Update custom font family dropdown
  const fontFamilyButtonText = document.getElementById('fontFamilyButtonText');
  if (fontFamilyButtonText) {
    const fontDisplayNames = {
      'system-ui': 'System Font',
      'serif': 'Serif',
      'monospace': 'Monospace',
      "'Times New Roman', serif": 'Times New Roman',
      "'Arial', sans-serif": 'Arial',
      "'Helvetica', sans-serif": 'Helvetica',
      "'Georgia', serif": 'Georgia',
      "'Courier New', monospace": 'Courier New',
      "'Verdana', sans-serif": 'Verdana'
    };
    
    fontFamilyButtonText.textContent = fontDisplayNames[state.settings.fontFamily] || 'System Font';
    fontFamilyButtonText.style.fontFamily = state.settings.fontFamily;
  }
  
  // Update default citation style dropdown
  const citationStyleSelect = document.getElementById('defaultCitationStyleSelect');
  if (citationStyleSelect) {
    citationStyleSelect.value = state.settings.defaultCitationStyle || 'mla';
  }
  
  const editor = document.getElementById('editor');
  const highlightLayer = document.getElementById('highlight-layer');
  
  editor.spellcheck = state.settings.spellCheck;
  
  // Apply font settings
  editor.style.fontSize = state.settings.fontSize + 'px';
  editor.style.fontFamily = state.settings.fontFamily;
  
  if (highlightLayer) {
    highlightLayer.style.fontSize = state.settings.fontSize + 'px';
    highlightLayer.style.fontFamily = state.settings.fontFamily;
  }
  
  const afterAppContent = document.getElementById('after-app-placeholder');
  if (afterAppContent) {
    afterAppContent.style.display = state.settings.focus ? 'none' : 'block';
  }
  
  // Apply Simplified Mode styling on page load/initialization
  if (state.settings.simplifiedMode) {
    const sidebar = document.getElementById('file-sidebar');
    const citationsPanel = document.getElementById('citations-panel');
    const gutter = document.getElementById('gutter');
    
    if (sidebar) sidebar.style.display = 'none';
    if (citationsPanel) {
      citationsPanel.style.display = 'flex';
      const generateCitationContainer = document.getElementById('generate-citation-container');
      const wordCountDetailsContainer = document.getElementById('word-count-details-container');
      const moreAppsContainer = document.getElementById('more-apps-container');
      const dictionaryContainer = document.getElementById('dictionary-container');
      const thesaurusContainer = document.getElementById('thesaurus-container');
      const pomodoroContainer = document.getElementById('pomodoro-container');
      const translateContainer = document.getElementById('translate-container');
      const notepadContainer = document.getElementById('notepad-container');
      const wordbankContainer = document.getElementById('wordbank-container');
      const scientificCalculatorContainer = document.getElementById('scientific-calculator-container');
      const graphingCalculatorContainer = document.getElementById('graphing-calculator-container');
      
      if (generateCitationContainer) generateCitationContainer.style.display = 'none';
      if (wordCountDetailsContainer) wordCountDetailsContainer.style.display = 'none';
      if (moreAppsContainer) moreAppsContainer.style.display = 'none';
      if (dictionaryContainer) dictionaryContainer.style.display = 'none';
      if (thesaurusContainer) thesaurusContainer.style.display = 'none';
      if (pomodoroContainer) pomodoroContainer.style.display = 'none';
      if (translateContainer) translateContainer.style.display = 'none';
      if (notepadContainer) notepadContainer.style.display = 'none';
      if (wordbankContainer) wordbankContainer.style.display = 'none';
      if (scientificCalculatorContainer) scientificCalculatorContainer.style.display = 'none';
      if (graphingCalculatorContainer) graphingCalculatorContainer.style.display = 'none';
      
      const panelTabSelector = document.getElementById('panel-tab-selector');
      const panelHeader = document.getElementById('panel-header');
      const moreToolsHeaderNav = document.getElementById('more-tools-header-nav');
      
      if (panelTabSelector) panelTabSelector.style.display = 'none';
      if (panelHeader) panelHeader.style.display = 'none';
      if (moreToolsHeaderNav) moreToolsHeaderNav.style.display = 'none';
    }
    if (gutter) gutter.style.display = 'none';
  }
  
  // Update counter settings display
  updateCounterSettings();
  
  updateBeforeUnloadHandler();
}

function resetSettings() {
  // Create countdown overlay
  const overlay = document.getElementById('overlay-background');
  const confirmation = document.getElementById('confirmation-overlay');
  
  let countdown = 3;
  
  confirmation.innerHTML = '';
  const h2 = document.createElement('h2');
  h2.textContent = 'Resetting...';
  h2.style.fontSize = '1.5rem';
  h2.style.marginBottom = '1rem';
  
  const countdownDisplay = document.createElement('div');
  countdownDisplay.style.fontSize = '3rem';
  countdownDisplay.style.fontWeight = 'bold';
  countdownDisplay.style.margin = '1.5rem 0';
  countdownDisplay.style.color = '#DC2626';
  countdownDisplay.textContent = countdown;
  
  const message = document.createElement('p');
  message.textContent = 'Clearing all settings and data...';
  message.style.color = '#666';
  message.style.fontSize = '0.9rem';
  
  confirmation.appendChild(h2);
  confirmation.appendChild(countdownDisplay);
  confirmation.appendChild(message);
  confirmation.style.display = 'block';
  overlay.style.display = 'block';
  
  // Start countdown
  const countdownInterval = setInterval(() => {
    countdown--;
    countdownDisplay.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      countdownDisplay.textContent = '✓';
      countdownDisplay.style.color = '#10B981';
      message.textContent = 'Refreshing application...';
      
      // Clear all localStorage data including fileManager
      localStorage.clear();
      
      // Refresh after a brief moment
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, 1000);
}

function exportSettings() {
  try {
    // Get settings and pinned tools from localStorage
    const settingsData = localStorage.getItem('settings');
    const pinnedToolsData = localStorage.getItem('pinnedTools');
    
    if (!settingsData) {
      notify('No settings found to export.', false);
      return;
    }

    // Create export object with all settings
    const exportData = {
      settings: JSON.parse(settingsData),
      pinnedTools: pinnedToolsData ? JSON.parse(pinnedToolsData) : ['generateCitation', 'details']
    };

    // Create a blob with the settings data
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `citecount-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    notify(`Settings exported successfully! Downloaded as ${filename}`, false);
  } catch (error) {
    console.error('Export error:', error);
    notify(`Failed to export settings. Error: ${error.message}`, false);
  }
}

function importSettings(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  if (!file.name.endsWith('.json')) {
    notify('Invalid file type. Please select a JSON file.', false);
    event.target.value = ''; // Reset input
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      // Parse the imported data
      const importedData = JSON.parse(e.target.result);
      
      // Validate the data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid settings format');
      }
      
      // Handle both old format (flat object) and new format (with pinnedTools)
      let importedSettings, importedPinnedTools;
      
      if (importedData.settings && importedData.pinnedTools !== undefined) {
        // New format
        importedSettings = importedData.settings;
        importedPinnedTools = importedData.pinnedTools;
      } else if (importedData.autoSave !== undefined || importedData.counters !== undefined) {
        // Old format - just settings
        importedSettings = importedData;
        importedPinnedTools = null;
      } else {
        throw new Error('Settings file does not contain valid CiteCount settings');
      }
      
      // Validate required fields in settings
      const requiredFields = ['autoSave', 'warnLeave', 'spellCheck'];
      const hasRequiredFields = requiredFields.some(field => field in importedSettings);
      
      if (!hasRequiredFields && !importedSettings.counters) {
        throw new Error('Settings file does not contain valid CiteCount settings');
      }
      
      // Merge with default settings to ensure all fields exist
      const mergedSettings = {
        ...state.settings,
        ...importedSettings
      };
      
      // Validate counters object if it exists
      if (importedSettings.counters) {
        // Ensure counters have required structure
        Object.keys(mergedSettings.counters).forEach(key => {
          if (!mergedSettings.counters[key].hasOwnProperty('enabled') || 
              !mergedSettings.counters[key].hasOwnProperty('order')) {
            throw new Error('Invalid counter settings structure');
          }
        });
      }
      
      // Update state and localStorage
      state.settings = mergedSettings;
      localStorage.setItem('settings', JSON.stringify(state.settings));
      
      // Import pinned tools if available
      if (importedPinnedTools && Array.isArray(importedPinnedTools)) {
        localStorage.setItem('pinnedTools', JSON.stringify(importedPinnedTools));
      }
      
      // Update UI
      updateSettingsUI();
      updateWordCount();
      
      // Apply settings
      document.getElementById('editor').spellcheck = state.settings.spellCheck;
      updateBeforeUnloadHandler();
      
      const afterAppContent = document.getElementById('after-app-placeholder');
      if (afterAppContent) {
        afterAppContent.style.display = state.settings.focus ? 'none' : 'block';
      }
      
      // Refresh tools display if function exists
      if (typeof updateToolsDisplay === 'function') {
        updateToolsDisplay();
      }
      
      notify(`Settings imported successfully from ${file.name}!`, false);
      
    } catch (error) {
      console.error('Import error:', error);
      notify(`Import failed: ${error.message}. Please check if the file is a valid CiteCount settings export.`, false);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };
  
  reader.onerror = function(error) {
    console.error('File read error:', error);
    notify(`Failed to read file ${file.name}. Please try again.`, false);
    event.target.value = '';
  };
  
  reader.readAsText(file);
}

function switchSettingsCategory(category, skipCounterEditor = false) {
  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.settings-category-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to clicked button
  const activeButton = document.querySelector(`[data-category="${category}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  // Hide all category contents
  const contents = document.querySelectorAll('.settings-category-content');
  contents.forEach(content => content.classList.remove('active'));
  
  // Show selected category content
  const activeContent = document.querySelector(`.settings-category-content[data-category="${category}"]`);
  if (activeContent) {
    activeContent.classList.add('active');
  }

  if (category === 'counter' && !skipCounterEditor) {
    openCounterDisplayEditor();
  }
}
