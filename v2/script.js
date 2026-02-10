const state = {
  citations: [],
  citationGroups: new Map(),
  includedCitations: new Map(),
  totalWords: 0,
  citationWords: 0,
  totalChars: 0,
  citationChars: 0,
  settings: {
    autoSave: true,
    warnLeave: true,
    spellCheck: true,
    focus: false,
    simplifiedMode: false,
    wordsNoCitations: true,
    charsNoCitations: true,
    wordsWithCitations: true,
    charsWithCitations: true,
    citations: true,
    fontSize: 16,
    fontFamily: 'system-ui',
    defaultCitationStyle: 'mla',
    // Counter display settings
    counters: {
      wordsNoCitations: { enabled: true, order: 0, shortName: 'Words without Citations', tooltip: 'Words without Citations' },
      wordsWithCitations: { enabled: true, order: 1, shortName: 'Total Words', tooltip: 'Total Words' },
      charsNoCitations: { enabled: true, order: 2, shortName: 'Characters without Citations', tooltip: 'Characters without Citations' },
      charsWithCitations: { enabled: true, order: 3, shortName: 'Total Characters', tooltip: 'Total Characters' },
      citations: { enabled: true, order: 4, shortName: 'Citations', tooltip: 'Citations' },
      speakingTime: { enabled: false, order: 5, shortName: 'Speaking Time', tooltip: 'Speaking Time' },
      readingTime: { enabled: false, order: 6, shortName: 'Reading Time', tooltip: 'Reading Time' },
      handwritingTime: { enabled: false, order: 7, shortName: 'Handwriting Time', tooltip: 'Handwriting Time' }
    }
  },
  currentOccurrenceIndex: new Map(),
  sortState: {
    field: 'none', // 'none', 'citation'
    direction: 'asc' // 'asc', 'desc'
  }
};

// Context menu and pinned tool editing variables
let contextMenuTargetTabId = null;
let contextMenuTargetTabIndex = -1;

document.addEventListener('DOMContentLoaded', function () {
  const editor = document.getElementById('editor');
  const highlightLayer = document.getElementById('highlight-layer');
  const welcomeText = document.getElementById('welcome-text');

  const savedContent = localStorage.getItem('rawData');
  if (!savedContent || !savedContent.trim()) {
    welcomeText.style.display = 'block';
  } else {
    editor.innerHTML = savedContent;
    welcomeText.style.display = 'none';
    handleEditorInput();
  }

  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    // Migrate old settings to new counter structure
    if (parsed && !parsed.counters) {
      state.settings = { ...state.settings, ...parsed };
      // Initialize counters based on old settings
      if (parsed.wordsNoCitations !== undefined) {
        state.settings.counters.wordsNoCitations.enabled = parsed.wordsNoCitations;
      }
      if (parsed.wordsWithCitations !== undefined) {
        state.settings.counters.wordsWithCitations.enabled = parsed.wordsWithCitations;
      }
      if (parsed.charsNoCitations !== undefined) {
        state.settings.counters.charsNoCitations.enabled = parsed.charsNoCitations;
      }
      if (parsed.charsWithCitations !== undefined) {
        state.settings.counters.charsWithCitations.enabled = parsed.charsWithCitations;
      }
      if (parsed.citations !== undefined) {
        state.settings.counters.citations.enabled = parsed.citations;
      }
    } else {
      state.settings = { ...state.settings, ...parsed };
    }
    
    // Sync citation style with localStorage
    if (state.settings.defaultCitationStyle) {
      localStorage.setItem('defaultCitationStyle', state.settings.defaultCitationStyle);
    }
    
    updateSettingsUI();
  } else {
    // Initialize settings in localStorage with default values
    localStorage.setItem('settings', JSON.stringify(state.settings));
    localStorage.setItem('defaultCitationStyle', state.settings.defaultCitationStyle);
    updateSettingsUI();
  }

  const savedCitationStates = localStorage.getItem('citationStates');
  if (savedCitationStates) {
    state.includedCitations = new Map(JSON.parse(savedCitationStates));
    // Ensure counters and highlights respect restored citation states on load
    updateWordCount();
    refreshHighlightLayer();
    updateCitationsTables();
  }

  // Initialize context menu for tab buttons
  initializeTabContextMenu();
  // Update tab labels based on pinned tools
  updatePinnedTabLabels();

  const savedSortState = localStorage.getItem('sortState');
  if (savedSortState) {
    state.sortState = JSON.parse(savedSortState);
  }

  const isPremium = localStorage.getItem('isPremium');
  if (isPremium === 'true') {
    document.getElementById('isPremiumDisplay').style.display = 'block';
  }

  editor.addEventListener('focus', function () {
    if (!editor.innerText.trim()) {
      editor.innerHTML = "";
      highlightLayer.innerHTML = "";
      welcomeText.style.display = 'block';
    }
  });

  editor.addEventListener('blur', function () {
    if (!editor.innerText.trim()) {
      welcomeText.style.display = 'block';
    }
  });

  editor.addEventListener('input', handleEditorInput);
  editor.addEventListener('scroll', syncScroll);
  editor.addEventListener('paste', handlePaste);
  editor.addEventListener('mouseup', updateWordCountWithSelection);
  editor.addEventListener('keyup', updateWordCountWithSelection);
  setupResizablePanels();
  setupDragAndDrop();
  updateWordCount();
  updateCounterDisplay(); // Initialize counter display
  updateCounterSettings(); // Initialize counter settings display
  updateSortButtonStates();
  setupAnnouncementBanner();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlays();
    }
    
    // Handle shortcuts that require modifier keys
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case ',':
          // Command/Ctrl + , opens settings (standard macOS/Windows shortcut)
          e.preventDefault();
          toggleSettingsOverlay(true);
          break;
        case 'z':
          if (e.shiftKey) {
            // Command/Ctrl + ⇧ + Z for redo
            e.preventDefault();
            redoText();
          } else {
            // Command/Ctrl + Z for undo
            e.preventDefault();
            undoText();
          }
          break;
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            formatText('strikethrough');
          }
          break;
      }
    }
  });

  // Handle clicks outside the dropdown to close it
  document.addEventListener('click', (e) => {
    // Handle format dropdown
    const formatDropdown = document.getElementById('format-dropdown');
    const formatButton = document.getElementById('format-dropdown-btn');
    
    if (formatDropdown && formatButton && !formatDropdown.contains(e.target) && !formatButton.contains(e.target)) {
      formatDropdown.classList.add('hidden');
    }

    // Handle font family dropdown
    const fontFamilyDropdown = document.getElementById('fontFamilyDropdown');
    const fontFamilyButton = document.getElementById('fontFamilyButton');
    
    if (fontFamilyDropdown && fontFamilyButton && !fontFamilyDropdown.contains(e.target) && !fontFamilyButton.contains(e.target)) {
      fontFamilyDropdown.classList.add('hidden');
    }
  });
});

function closeOverlays() {
  toggleCitationsOverlay(false);
  toggleSettingsOverlay(false);
  toggleHelpOverlay(false);
  toggleAppsModal(false);
  if (typeof closeDownloadModal === 'function') {
    closeDownloadModal();
  }
  closePastePermissionModal();
  closeExcludeCitationInfoModal();
  document.getElementById('confirmation-overlay').style.display = 'none';
  document.getElementById('info-dialogue').style.display = 'none';
  document.getElementById('overlay-background').style.display = 'none';
  const formatDropdown = document.getElementById('format-dropdown');
  if (formatDropdown) {
    formatDropdown.classList.add('hidden');
  }
  const fontFamilyDropdown = document.getElementById('fontFamilyDropdown');
  if (fontFamilyDropdown) {
    fontFamilyDropdown.classList.add('hidden');
  }
}

function toggleAppsModal(show) {
  const modal = document.getElementById('apps-modal');
  
  // If no argument provided, toggle based on current state
  if (show === undefined) {
    show = modal.style.display === 'none' || !modal.style.display;
  }
  
  if (show) {
    modal.style.display = 'block';
    // Trigger animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }, 10);
    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', closeAppsModalOnClickOutside);
    }, 100);
  } else {
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 150);
    document.removeEventListener('click', closeAppsModalOnClickOutside);
  }
}

function closeAppsModalOnClickOutside(event) {
  const modal = document.getElementById('apps-modal');
  const appsButton = document.getElementById('other-apps-btn');
  
  if (modal && !modal.contains(event.target) && !appsButton.contains(event.target)) {
    toggleAppsModal(false);
  }
}

function handlePaste(e) {
  e.preventDefault();
  let text = e.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
  handleEditorInput();
}

function handleEditorInput() {
  if (document.getElementById('editor').innerText === "!dev") {
    notify('Developer mode enabled');
    document.getElementById('devToolsWindow').style.display = "flex";
    document.getElementById('detectSubject').style.display = "flex";
    return;
  }
  const editor = document.getElementById('editor');
  const highlightLayer = document.getElementById('highlight-layer');
  const welcomeText = document.getElementById('welcome-text');
  const content = editor.innerHTML;
  highlightLayer.innerHTML = highlightCitations(content);
  syncScroll();
  if (state.settings.autoSave) saverawData();
  welcomeText.style.display = editor.innerText.trim() ? 'none' : 'block';
  
  // Auto-rename untitled projects based on first line of text
  autoRenameUntitledProject();
  
  debounce(updateWordCount, 300)();
}

function autoRenameUntitledProject() {
  // Only auto-rename if we have a current project
  if (!fileManager.currentProject) return;
  
  const currentProject = fileManager.projects.find(p => p.id === fileManager.currentProject);
  if (!currentProject) return;
  
  // Only auto-rename if the project is still named "Untitled Project" (default untitled name)
  if (!currentProject.name.startsWith('Untitled Project')) return;
  
  const editor = document.getElementById('editor');
  const text = editor.innerText.trim();
  
  if (!text) return;
  
  // Get the first line of text (everything before the first line break)
  const firstLine = text.split('\n')[0].trim();
  
  // Only rename if the first line has meaningful content (at least 3 characters)
  if (firstLine && firstLine.length >= 3) {
    // Limit the name to 50 characters to avoid excessively long names
    const newName = firstLine.substring(0, 50);
    
    // Rename the project
    fileManager.renameProject(fileManager.currentProject, newName);
  }
}

function saverawData() {
  const editor = document.getElementById('editor');
  localStorage.setItem('rawData', editor.innerHTML);
}

function saveCitationStates() {
  const citationStatesArray = Array.from(state.includedCitations.entries());
  localStorage.setItem('citationStates', JSON.stringify(citationStatesArray));
}

function saveSortState() {
  localStorage.setItem('sortState', JSON.stringify(state.sortState));
}

function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(state.settings));
  updateSettingsUI();
  updateWordCount();
}

function toggleSetting(setting, value) {
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
  if (setting === 'simplifiedMode') {
    // Keep the toggle flipped - don't revert yet
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
        if (checkbox) checkbox.checked = !value;
        state.settings[setting] = !value;
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
      'system-ui': 'System UI',
      'serif': 'Serif',
      'monospace': 'Monospace',
      "'Times New Roman', serif": 'Times New Roman',
      "'Arial', sans-serif": 'Arial',
      "'Helvetica', sans-serif": 'Helvetica',
      "'Georgia', serif": 'Georgia',
      "'Courier New', monospace": 'Courier New',
      "'Verdana', sans-serif": 'Verdana'
    };
    
    fontFamilyButtonText.textContent = fontDisplayNames[state.settings.fontFamily] || 'System UI';
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

let citationCounter = 0;
function highlightCitations(content) {
  citationCounter = 0;
  return content.replace(/[()（）][^()（）]*[()（）]/g, (match) => {
    citationCounter++;
    const citationText = match.slice(1, -1);
    // Default to included unless explicitly excluded
    const isIncluded = state.includedCitations.get(citationText);
    const includedState = (isIncluded === undefined) ? true : isIncluded;
    return `<span id="citation-${citationCounter}" class="citation-highlight ${includedState ? 'included' : 'excluded'}">${match}</span>`;
  });
}

function refreshHighlightLayer() {
  const editor = document.getElementById('editor');
  const highlightLayer = document.getElementById('highlight-layer');

  if (editor && highlightLayer) {
    highlightLayer.innerHTML = highlightCitations(editor.innerHTML);
    syncScroll();
  }
}

const allowedDomains = [
  'citecount.netlify.app',
  '127.0.0.1:5500',
  'citecount-priv.netlify.app',
  'cite.js.org',
  'citecount.com'
];

function syncScroll() {
  const editor = document.getElementById('editor');
  const highlightLayer = document.getElementById('highlight-layer');
  highlightLayer.scrollTop = editor.scrollTop;
  highlightLayer.scrollLeft = editor.scrollLeft;
}

function debounce(func, delay) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function setupResizablePanels() {
  const gutter = document.getElementById('gutter');
  const editorPanel = document.getElementById('editor-panel');
  const citationsPanel = document.getElementById('citations-panel');
  const split = document.querySelector('.split');
  let isResizing = false;
  let startX, startWidthEditor, startWidthCitations;
  let resizeOverlay = null;
  let previousBodyUserSelect = '';

  function addResizeOverlay() {
    if (resizeOverlay) return;
    resizeOverlay = document.createElement('div');
    resizeOverlay.style.position = 'fixed';
    resizeOverlay.style.inset = '0';
    resizeOverlay.style.cursor = 'ew-resize';
    resizeOverlay.style.zIndex = '9999';
    resizeOverlay.style.background = 'transparent';
    resizeOverlay.style.pointerEvents = 'auto';
    resizeOverlay.style.userSelect = 'none';
    document.body.appendChild(resizeOverlay);
  }

  function removeResizeOverlay() {
    if (!resizeOverlay) return;
    resizeOverlay.remove();
    resizeOverlay = null;
  }

  function updatePanelFlex() {
    const isMobile = window.innerWidth < 1024;
    split.style.flexDirection = isMobile ? 'column' : 'row';
    
    if (isMobile) {
      editorPanel.style.flex = '1';
      citationsPanel.style.flex = '0';
      citationsPanel.classList.add('hidden');
      gutter.style.display = 'none';
    } else {
      split.style.flexDirection = 'row';
      const containerWidth = split.offsetWidth;
      const minWidth = 30;
      const maxWidth = 70;
      const baseWidth = Math.min(maxWidth, Math.max(minWidth, Math.floor(containerWidth * 0.5 / containerWidth * 100)));
      editorPanel.style.flex = `0 0 ${baseWidth}%`;
      citationsPanel.style.flex = `0 0 ${100 - baseWidth}%`;
      citationsPanel.classList.remove('hidden');
      gutter.style.display = 'block';
    }
  }

  function startResize(e) {
    if (window.innerWidth < 1024) return;
    isResizing = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    startWidthEditor = editorPanel.offsetWidth;
    startWidthCitations = citationsPanel.offsetWidth;
    addResizeOverlay();
    previousBodyUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    document.documentElement.style.cursor = 'ew-resize';
    e.preventDefault();
  }

  function handleResize(e) {
    if (!isResizing) return;
    if (e.type.includes('touch')) {
      e.preventDefault();
    }
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const container = document.querySelector('.split');
    const containerWidth = container.offsetWidth;
    const movementX = currentX - startX;
    const newEditorWidth = (startWidthEditor + movementX) / containerWidth * 100;
    const newCitationsWidth = 100 - newEditorWidth;
    const minWidth = 30;
    const maxWidth = 70;

    if (newEditorWidth >= minWidth && newEditorWidth <= maxWidth && 
        newCitationsWidth >= minWidth && newCitationsWidth <= maxWidth) {
      editorPanel.style.flex = `0 0 ${newEditorWidth}%`;
      citationsPanel.style.flex = `0 0 ${newCitationsWidth}%`;
      document.documentElement.style.cursor = 'ew-resize';
    } else if (newEditorWidth < minWidth) {
      document.documentElement.style.cursor = 'e-resize';
    } else if (newEditorWidth > maxWidth) {
      document.documentElement.style.cursor = 'w-resize';
    }
  }

  function stopResize() {
    isResizing = false;
    removeResizeOverlay();
    document.body.style.userSelect = previousBodyUserSelect;
    document.documentElement.style.cursor = '';
  }

  updatePanelFlex();
  window.addEventListener('resize', updatePanelFlex);

  gutter.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);

  gutter.addEventListener('touchstart', startResize);
  document.addEventListener('touchmove', handleResize, { passive: false });
  document.addEventListener('touchend', stopResize);
  document.addEventListener('touchcancel', stopResize);
}

function updateLayout() {
  const manageBtn = document.getElementById('manage-citations-btn');
  const editorContainer = document.querySelector('.editor-container');
  const split = document.querySelector('.split');
  const citationsPanel = document.getElementById('citations-panel');

  if (window.innerWidth < 1024) {
    manageBtn.style.display = 'block';
    editorContainer.style.flex = '1';
    split.style.flexDirection = 'column';
    citationsPanel.classList.add('hidden');
  } else {
    manageBtn.style.display = 'none';
    split.style.flexDirection = 'row';
    editorContainer.style.flex = '';
    citationsPanel.classList.remove('hidden');
    setupResizablePanels();
  }
  updateWordCountWithSelection();
  updateStatsMargin();
}

function setupDragAndDrop() {
  const dropOverlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  // Track dragenter/dragleave on window for full-screen detection
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    // Only show drop overlay for actual file drops, not sidebar item reordering
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      if (dropOverlay) {
        dropOverlay.style.display = 'flex';
      }
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    // Only show drop overlay for actual file drops, not sidebar item reordering
    if (e.dataTransfer.types.includes('Files')) {
      if (dropOverlay) {
        dropOverlay.style.display = 'flex';
      }
    }
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter--;
      // Only hide when all drag events have left
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (dropOverlay) dropOverlay.style.display = 'none';
      }
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dropOverlay) dropOverlay.style.display = 'none';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleFilesDrop(files);
    }
  });
}

function handleMultipleFilesDrop(files) {
  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;
  
  // Show progress UI for all files (including single file)
  showFileImportProgress(totalFiles);
  processFilesSequentially(fileArray, 0, totalFiles);
}

function showFileImportProgress(totalFiles) {
  importStartTime = Date.now();
  fileProcessingTimes = [];
  
  const progressHTML = `
    <div id="file-import-progress" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
         background: var(--background-primary); border: 1px solid var(--border-primary); border-radius: 12px; 
         padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 10002; width: 500px; max-width: 90vw;">
      <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 600;">Importing Files</h3>
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.875rem; color: var(--text-secondary);">
          <span id="progress-status" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 8px;">Processing files...</span>
          <span id="progress-count" style="flex-shrink: 0;">0 / ${totalFiles}</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--background-secondary); border-radius: 4px; overflow: hidden;">
          <div id="progress-bar-fill" style="width: 0%; height: 100%; background: #1F40AF; transition: width 0.3s ease;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
          <span id="time-elapsed">Elapsed: 0s</span>
          <span id="time-remaining">Estimated: --</span>
        </div>
      </div>
      <div id="file-import-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 16px; overflow-x: hidden;">
        <!-- File items will be added here -->
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="import-cancel-btn" onclick="cancelFileImport()" style="padding: 8px 16px; border-radius: 6px; background: transparent; 
                border: 1px solid var(--border-primary); cursor: pointer; font-size: 0.875rem;">Cancel</button>
        <button id="import-done-btn" onclick="closeFileImportProgress()" style="padding: 8px 16px; border-radius: 6px; 
                background: #1F40AF; color: white; border: none; cursor: pointer; font-size: 0.875rem; display: none;">Done</button>
      </div>
    </div>
    <div id="file-import-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
         background: rgba(0,0,0,0.5); z-index: 10001;" onclick="event.stopPropagation();"></div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = progressHTML;
  document.body.appendChild(tempDiv.firstElementChild);
  document.body.appendChild(tempDiv.lastElementChild);
}

let isImportCancelled = false;
let importStartTime = null;
let fileProcessingTimes = [];

function cancelFileImport() {
  isImportCancelled = true;
  const cancelBtn = document.getElementById('import-cancel-btn');
  if (cancelBtn) {
    cancelBtn.textContent = 'Cancelling...';
    cancelBtn.disabled = true;
  }
}

function closeFileImportProgress() {
  const progressEl = document.getElementById('file-import-progress');
  const overlayEl = document.getElementById('file-import-overlay');
  if (progressEl) progressEl.remove();
  if (overlayEl) overlayEl.remove();
  isImportCancelled = false;
  importStartTime = null;
  fileProcessingTimes = [];
}

function goToImportedFile(fileId) {
  // Get the project ID from the file item
  const fileItem = document.getElementById(fileId);
  if (!fileItem) return;
  
  const projectId = fileItem.dataset.projectId;
  if (!projectId) return;
  
  // Close the import progress modal
  closeFileImportProgress();
  
  // Load the project using fileManager
  if (typeof fileManager !== 'undefined' && fileManager.loadProject) {
    fileManager.loadProject(projectId);
    fileManager.currentProject = projectId;
    fileManager.renderFileTree();
  }
}

function addFileToImportList(fileName, status = 'pending', projectId = null) {
  const fileList = document.getElementById('file-import-list');
  if (!fileList) return;
  
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const statusIcon = {
    'pending': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/></svg>',
    'processing': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>',
    'success': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    'error': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };
  
  const fileItem = document.createElement('div');
  fileItem.id = fileId;
  fileItem.dataset.projectId = projectId || '';
  fileItem.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; background: var(--background-secondary); margin-bottom: 8px;';
  
  const goToButtonHTML = projectId ? `
    <button onclick="goToImportedFile('${fileId}')" 
      style="flex-shrink: 0; padding: 4px 8px; background: #1F40AF; color: white; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.2s;"
      onmouseover="this.style.background='#1F40AF'" onmouseout="this.style.background='#1F40AF'" 
      title="Go to this file">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="display: inline; margin-right: 4px; vertical-align: -2px;">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Open
    </button>
  ` : '';
  
  fileItem.innerHTML = `
    <div class="file-status-icon" style="flex-shrink: 0;">${statusIcon[status]}</div>
    <div style="flex: 1; min-width: 0; overflow: hidden;">
      <div style="font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${fileName}">${fileName}</div>
      <div class="file-status-text" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Waiting...</div>
    </div>
    ${goToButtonHTML}
  `;
  
  fileList.appendChild(fileItem);
  
  // Auto-scroll to the bottom to show the newly added file
  fileList.scrollTop = fileList.scrollHeight;
  
  return fileId;
}

function updateFileImportStatus(fileId, status, message = '') {
  const fileItem = document.getElementById(fileId);
  if (!fileItem) return;
  
  const statusIcon = {
    'pending': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/></svg>',
    'processing': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>',
    'success': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    'error': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };
  
  const iconEl = fileItem.querySelector('.file-status-icon');
  const textEl = fileItem.querySelector('.file-status-text');
  
  if (iconEl) iconEl.innerHTML = statusIcon[status];
  if (textEl) {
    textEl.textContent = message || {
      'pending': 'Waiting...',
      'processing': 'Processing...',
      'success': 'Imported successfully',
      'error': 'Failed to import'
    }[status];
    
    if (status === 'error') {
      textEl.style.color = '#ef4444';
    } else if (status === 'success') {
      textEl.style.color = '#10b981';
    }
  }
}

function processFilesSequentially(files, currentIndex, totalFiles) {
  if (isImportCancelled) {
    updateProgressUI(currentIndex, totalFiles, 'Import cancelled');
    showImportDoneButton();
    notify('File import cancelled', false, null, 'warning');
    return;
  }
  
  if (currentIndex >= totalFiles) {
    updateProgressUI(totalFiles, totalFiles, 'All files processed');
    showImportDoneButton();
    return;
  }
  
  const file = files[currentIndex];
  const fileId = addFileToImportList(file.name);
  updateProgressUI(currentIndex, totalFiles, `Processing ${file.name}...`);
  
  // Update file status to processing
  updateFileImportStatus(fileId, 'processing', 'Processing...');
  
  // Process the file
  processFileWithProgress(file, fileId, (success, errorMessage, projectId) => {
    if (success) {
      // Update file item with projectId if available
      const fileItem = document.getElementById(fileId);
      if (fileItem && projectId) {
        fileItem.dataset.projectId = projectId;
        // Re-render the button HTML
        const button = fileItem.querySelector('button');
        if (!button) {
          const goToButtonHTML = `
            <button onclick="goToImportedFile('${fileId}')" 
              style="flex-shrink: 0; padding: 4px 8px; background: #1F40AF; color: white; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.2s;"
              onmouseover="this.style.background='#1F40AF'" onmouseout="this.style.background='#1F40AF'" 
              title="Go to this file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="display: inline; margin-right: 4px; vertical-align: -2px;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open
            </button>
          `;
          const div = document.createElement('div');
          div.innerHTML = goToButtonHTML;
          fileItem.appendChild(div.firstElementChild);
        }
      }
      updateFileImportStatus(fileId, 'success', 'Imported successfully');
    } else {
      updateFileImportStatus(fileId, 'error', errorMessage || 'Failed to import');
    }
    
    // Update overall progress
    updateProgressUI(currentIndex + 1, totalFiles, success ? 
      `Imported ${file.name}` : `Failed to import ${file.name}`);
    
    // Process next file after a short delay
    setTimeout(() => {
      processFilesSequentially(files, currentIndex + 1, totalFiles);
    }, 300);
  });
}

function formatTime(seconds) {
  if (seconds < 60) {
    return Math.round(seconds) + 's';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function updateProgressUI(current, total, statusText) {
  const progressCount = document.getElementById('progress-count');
  const progressStatus = document.getElementById('progress-status');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const timeElapsed = document.getElementById('time-elapsed');
  const timeRemaining = document.getElementById('time-remaining');
  
  if (progressCount) progressCount.textContent = `${current} / ${total}`;
  if (progressStatus) progressStatus.textContent = statusText;
  if (progressBarFill) {
    const percentage = (current / total) * 100;
    progressBarFill.style.width = `${percentage}%`;
  }
  
  // Update elapsed time
  if (timeElapsed && importStartTime) {
    const elapsed = (Date.now() - importStartTime) / 1000;
    timeElapsed.textContent = `Elapsed: ${formatTime(elapsed)}`;
  }
  
  // Update estimated remaining time
  if (timeRemaining && current > 0 && current < total) {
    const elapsed = (Date.now() - importStartTime) / 1000;
    const avgTimePerFile = elapsed / current;
    const remainingFiles = total - current;
    const estimatedRemaining = avgTimePerFile * remainingFiles;
    timeRemaining.textContent = `Time remaining: About ${formatTime(estimatedRemaining)}`;
  } else if (timeRemaining && current >= total) {
    timeRemaining.textContent = '';
  }
}

function showImportDoneButton() {
  const cancelBtn = document.getElementById('import-cancel-btn');
  const doneBtn = document.getElementById('import-done-btn');
  
  if (cancelBtn) cancelBtn.style.display = 'none';
  if (doneBtn) doneBtn.style.display = 'block';
}

function processFileWithProgress(file, fileId, callback) {
  const editor = document.getElementById('editor');
  const welcomeText = document.getElementById('welcome-text');
  
  // Check file type first - note: .doc (legacy Word) is not supported, only .docx
  const isValidType = file.type === 'application/pdf' || 
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                      file.type === 'text/plain';
  
  // Check for .doc files specifically to provide helpful error message
  if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
    callback(false, 'Legacy .doc files are not supported. Please save your document as .docx (Word 2007 or later format) and try again.', null);
    return;
  }
  
  if (!isValidType) {
    callback(false, 'Unsupported file type. Only .docx, .pdf, and .txt files are supported.', null);
    return;
  }
  
  // Check if scripts are already loaded
  if (typeof pdfjsLib === 'undefined' || typeof mammoth === 'undefined') {
    loadScriptsOnDemand(() => {
      processFileContent(file, editor, welcomeText, fileId, callback);
    });
  } else {
    processFileContent(file, editor, welcomeText, fileId, callback);
  }
}

function processFileContent(file, editor, welcomeText, fileId, callback) {
  const fileNameWithoutExt = file.name.replace(/\.(pdf|docx|txt)$/i, '');
  
  // Always create a new project for each file in batch import
  let newProjectId;
  if (typeof fileManager !== 'undefined') {
    // Don't auto-switch to avoid jumping between projects during batch import
    newProjectId = fileManager.createProject(fileNameWithoutExt, false);
  }
  
  if (file.type === 'text/plain') {
    // Handle .txt files
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      
      // Save content to the new project
      if (newProjectId && typeof fileManager !== 'undefined') {
        const project = fileManager.projects.find(p => p.id === newProjectId);
        if (project) {
          project.content = text;
          fileManager.saveToStorage();
          // Update file item with projectId
          const fileItem = document.getElementById(fileId);
          if (fileItem) fileItem.dataset.projectId = newProjectId;
        }
      }
      
      callback(true, null, newProjectId);
    };
    reader.onerror = () => {
      callback(false, 'Failed to read text file', null);
    };
    reader.readAsText(file);
  } else if (file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        
        // Save content to the new project
        if (newProjectId && typeof fileManager !== 'undefined') {
          const project = fileManager.projects.find(p => p.id === newProjectId);
          if (project) {
            project.content = text;
            fileManager.saveToStorage();
            // Update file item with projectId
            const fileItem = document.getElementById(fileId);
            if (fileItem) fileItem.dataset.projectId = newProjectId;
          }
        }
        
        callback(true, null, newProjectId);
      } catch (err) {
        console.error('PDF processing error:', err);
        callback(false, 'Error reading PDF file: ' + err.message, null);
      }
    };
    reader.onerror = () => {
      callback(false, 'Failed to read file', null);
    };
    reader.readAsArrayBuffer(file);
    
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const reader = new FileReader();
    reader.onload = function (e) {
      mammoth.extractRawText({ arrayBuffer: e.target.result })
        .then(result => {
          // Save content to the new project
          if (newProjectId && typeof fileManager !== 'undefined') {
            const project = fileManager.projects.find(p => p.id === newProjectId);
            if (project) {
              project.content = result.value;
              fileManager.saveToStorage();
              // Update file item with projectId
              const fileItem = document.getElementById(fileId);
              if (fileItem) fileItem.dataset.projectId = newProjectId;
            }
          }
          callback(true, null, newProjectId);
        })
        .catch(err => {
          console.error('DOCX processing error:', err);
          callback(false, 'Error reading DOCX file: ' + err.message, null);
        });
    };
    reader.onerror = () => {
      callback(false, 'Failed to read file', null);
    };
    reader.readAsArrayBuffer(file);
  }
}
function loadScriptsOnDemand(callback) {
  const scripts = [
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js"
  ];
  
  let loadedCount = 0;
  scripts.forEach(src => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) callback();
      };
      document.body.appendChild(script);
  });
}

function handleFileDrop(file) {
  const editor = document.getElementById('editor');
  const welcomeText = document.getElementById('welcome-text');

  // Check if scripts are already loaded
  if (typeof pdfjsLib === 'undefined' || typeof mammoth === 'undefined') {
      loadScriptsOnDemand(() => {
          processFile(file, editor, welcomeText); // Process file after scripts load
      });
  } else {
      processFile(file, editor, welcomeText); // Scripts already loaded, process immediately
  }
}

function processFile(file, editor, welcomeText) {
  // Check if current project has content
  const hasExistingContent = editor.innerText.trim().length > 0;
  const fileNameWithoutExt = file.name.replace(/\.(pdf|docx|txt)$/i, '');
  
  // Check for .doc files specifically to provide helpful error message
  if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
    notify('Legacy .doc files are not supported. Please save your document as .docx (Word 2007 or later format) and try again.');
    return;
  }
  
  if (file.type === 'text/plain') {
    // Handle .txt files
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      
      // If project has content, create new project; otherwise use current
      if (hasExistingContent && typeof fileManager !== 'undefined') {
        const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
        // The createProject with autoSwitch will handle loading the new project
        editor.innerText = text;
      } else {
        editor.innerText = text;
        // Update current project name to match filename
        if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
          fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
        }
      }
      
      welcomeText.style.display = 'none';
      handleEditorInput();
      notify(`${file.name} has been imported successfully!`);
    };
    reader.onerror = () => {
      notify('Failed to read text file');
    };
    reader.readAsText(file);
  } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async function (e) {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map(item => item.str).join(' ') + '\n';
          }
          
          // If project has content, create new project; otherwise use current
          if (hasExistingContent && typeof fileManager !== 'undefined') {
            const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
            // The createProject with autoSwitch will handle loading the new project
            editor.innerText = text;
          } else {
            editor.innerText = text;
            // Update current project name to match filename
            if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
              fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
            }
          }
          
          welcomeText.style.display = 'none';
          handleEditorInput();
          notify(`${file.name} has been imported successfully!`);
      };
      reader.readAsArrayBuffer(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const reader = new FileReader();
      reader.onload = function (e) {
          mammoth.extractRawText({ arrayBuffer: e.target.result })
              .then(result => {
                  // If project has content, create new project; otherwise use current
                  if (hasExistingContent && typeof fileManager !== 'undefined') {
                    const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
                    // The createProject with autoSwitch will handle loading the new project
                    editor.innerText = result.value;
                  } else {
                    editor.innerText = result.value;
                    // Update current project name to match filename
                    if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
                      fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
                    }
                  }
                  
                  welcomeText.style.display = 'none';
                  handleEditorInput();
                  notify(`${file.name} has been imported successfully!`);
              })
              .catch(err => {
                  notify('Error reading DOCX file: ' + err.message);
              });
      };
      reader.readAsArrayBuffer(file);
  } else {
      notify('Unsupported file type. Please use .docx, .pdf, or .txt files.');
  }
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    handleMultipleFilesDrop(files);
  }
  // Reset the input so the same file can be selected again
  event.target.value = '';
}

function pasteFromClipboard() {
  navigator.clipboard.readText().then(text => {
    const editor = document.getElementById('editor');
    const welcomeText = document.getElementById('welcome-text');
    editor.innerText = text;
    welcomeText.style.display = 'none';
    handleEditorInput();
  }).catch(err => {
    // Show the comprehensive help modal instead of just a notification
    showPastePermissionModal();
  });
}

function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for Safari (must check before Chrome as Safari also contains "chrome" in UA)
  if (userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1) {
    return 'safari';
  }
  // Check for Edge
  if (userAgent.indexOf('edg') !== -1) {
    return 'edge';
  }
  // Check for Chrome
  if (userAgent.indexOf('chrome') !== -1) {
    return 'chrome';
  }
  // Check for Firefox
  if (userAgent.indexOf('firefox') !== -1) {
    return 'firefox';
  }
  
  // Default to Chrome if unable to detect
  return 'chrome';
}

function showPastePermissionModal() {
  const modal = document.getElementById('paste-permission-modal');
  const background = document.getElementById('overlay-background');
  if (modal && background) {
    modal.style.display = 'flex';
    background.style.display = 'block';
    
    // Automatically show the guide for the detected browser
    const detectedBrowser = detectBrowser();
    showBrowserGuide(detectedBrowser);
  }
}

function closePastePermissionModal() {
  const modal = document.getElementById('paste-permission-modal');
  const background = document.getElementById('overlay-background');
  if (modal && background) {
    modal.style.display = 'none';
    background.style.display = 'none';
  }
}

function showBrowserGuide(browser) {
  // Hide all guides
  const guides = document.querySelectorAll('.browser-guide');
  guides.forEach(guide => guide.classList.remove('active'));
  
  // Hide all tabs
  const tabs = document.querySelectorAll('.browser-tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Show selected guide and tab
  const selectedGuide = document.getElementById(`${browser}-guide`);
  const selectedTab = document.querySelector(`[data-browser="${browser}"]`);
  
  if (selectedGuide) selectedGuide.classList.add('active');
  if (selectedTab) selectedTab.classList.add('active');
}

function tryPasteAgain() {
  closePastePermissionModal();
  // Try pasting again
  pasteFromClipboard();
}

function toggleCitationsOverlay(show) {
  const overlay = document.getElementById('citations-overlay');
  const background = document.getElementById('overlay-background');
  
  if (show) {
    overlay.classList.add('open');
    background.style.display = 'block';
  } else {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
    background.style.display = 'none';
  }
}

function toggleSettingsOverlay(show) {
  const overlay = document.getElementById('settings-overlay');
  const background = document.getElementById('overlay-background');
  
  if (show) {
    // Store current settings when opening
    if (typeof storeCurrentSettings === 'function') {
      storeCurrentSettings();
    }
    overlay.classList.add('open');
    background.style.display = 'block';
  } else {
    // Validate before closing
    if (typeof canCloseSettings === 'function' && !canCloseSettings()) {
      return; // Don't close if validation fails
    }
    overlay.classList.remove('open');
    overlay.style.display = 'none';
    background.style.display = 'none';
  }
  
  // Update storage display when settings are opened
  if (show && typeof fileManager !== 'undefined' && fileManager.updateStorageDisplay) {
    fileManager.updateStorageDisplay();
  }
}

function switchSettingsCategory(category) {
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
}

function toggleHelpOverlay(show) {
  const overlay = document.getElementById('help-overlay');
  const background = document.getElementById('overlay-background');
  
  if (show) {
    overlay.classList.add('open');
    background.style.display = 'block';
  } else {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
    background.style.display = 'none';
  }
}

function formatText(command) {
  document.execCommand(command, false, null);
  document.getElementById('editor').focus();
  handleEditorInput();
}

function undoText() {
  if (!document.queryCommandEnabled('undo')) {
    notify('Nothing to undo.');
    return;
  }
  document.execCommand('undo', false, null);
  document.getElementById('editor').focus();
  handleEditorInput();
}

function redoText() {
  if (!document.queryCommandEnabled('redo')) {
    notify('Nothing to redo.');
    return;
  }
  document.execCommand('redo', false, null);
  document.getElementById('editor').focus();
  handleEditorInput();
}

function toggleFormatDropdown() {
  const dropdown = document.getElementById('format-dropdown');
  dropdown.classList.toggle('hidden');
}

function copyText() {
  const editor = document.getElementById('editor');
  const copyBtn = document.getElementById('copy-btn');
  const text = editor.innerText;
  
  if (text.trim() === '') {
    showNotification('No text to copy!', false, null, 'warning');
    return;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    // Change tooltip to "Copied!"
    copyBtn.setAttribute('data-tooltip', 'Copied!');
    showNotification('Text copied to clipboard!', false, null, 'success');
    
    // Reset tooltip back to "Copy Text" after 2 seconds
    setTimeout(() => {
      copyBtn.setAttribute('data-tooltip', 'Copy Text');
    }, 2000);
  }).catch(err => {
    // Fallback for older browsers
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      
      // Change tooltip to "Copied!"
      copyBtn.setAttribute('data-tooltip', 'Copied!');
      showNotification('Text copied to clipboard!', false, null, 'success');
      
      // Reset tooltip back to "Copy Text" after 2 seconds
      setTimeout(() => {
        copyBtn.setAttribute('data-tooltip', 'Copy Text');
      }, 2000);
    } catch (fallbackErr) {
      showNotification('Failed to copy text. Please try selecting and copying manually.', false, null, 'error');
    }
  });
}

function clearText() {
  showNotification('Are you sure you want to clear all text? This action cannot be undone.', true, () => {
    const editor = document.getElementById('editor');
    const highlightLayer = document.getElementById('highlight-layer');
    const welcomeText = document.getElementById('welcome-text');
    editor.innerHTML = '';
    highlightLayer.innerHTML = '';
    welcomeText.style.display = 'block';
    state.citations = [];
    state.citationGroups.clear();
    state.includedCitations.clear();
    localStorage.removeItem('rawData');
    localStorage.removeItem('citationStates');
    updateWordCount();
  }, 'confirmation');
}

function updateWordCountWithSelection() {
  const selection = window.getSelection();
  let text = document.getElementById('editor').innerText;

  if (selection.rangeCount > 0 && selection.toString().length > 0) {
    text = selection.toString();
  }

  state.totalWords = countWords(text);
  state.totalChars = countChars(text);
  state.citations = findCitations(text);
  groupCitations();
  calculateCitationWords();
  calculateCitationChars();

  // Update state variables for counters
  state.wordsWithCitations = state.totalWords;
  state.wordsNoCitations = state.totalWords - state.citationWords;
  state.charsWithCitations = state.totalChars;
  state.charsNoCitations = state.totalChars - state.citationChars;

  // Update traditional individual counters for backward compatibility
  const totalWordCountEl = document.getElementById('total-word-count');
  const filteredWordCountEl = document.getElementById('filtered-word-count');
  const totalCharCountEl = document.getElementById('total-char-count');
  const filteredCharCountEl = document.getElementById('filtered-char-count');
  const quoteCountEl = document.getElementById('quote-count');
  
  if (totalWordCountEl) {
    totalWordCountEl.textContent = state.settings.wordsWithCitations ? state.totalWords : (state.settings.wordsNoCitations ? (state.totalWords - state.citationWords) : '0');
  }
  if (filteredWordCountEl) {
    filteredWordCountEl.textContent = state.settings.wordsNoCitations ? (state.totalWords - state.citationWords) : '0';
  }
  if (totalCharCountEl) {
    totalCharCountEl.textContent = state.settings.charsWithCitations ? state.totalChars : (state.settings.charsNoCitations ? (state.totalChars - state.citationChars) : '0');
  }
  if (filteredCharCountEl) {
    filteredCharCountEl.textContent = state.settings.charsNoCitations ? (state.totalChars - state.citationChars) : '0';
  }
  if (quoteCountEl) {
    quoteCountEl.textContent = state.settings.citations ? getIncludedCitationCount() : '0';
  }

  // Update dynamic counter display
  updateCounterDisplay();
  updateCitationsTables();  
  updateTimeDetails();
}

function updateWordCount() {
  updateWordCountWithSelection();
}

function groupCitations() {
  state.citationGroups = new Map();
  state.citations.forEach(citation => {
    if (state.citationGroups.has(citation)) {
      const group = state.citationGroups.get(citation);
      group.count++;
    } else {
      state.citationGroups.set(citation, {
        text: citation,
        count: 1,
        wordCount: countWords(citation),
        charCount: countChars(citation)  // Added
      });
      // Default to included unless explicitly excluded
      if (!state.includedCitations.has(citation)) {
        state.includedCitations.set(citation, true);
      }
    }
  });
}

function calculateCitationWords() {
  state.citationWords = 0;
  state.citationGroups.forEach((group, citationText) => {
    if (!state.includedCitations.get(citationText)) {
      state.citationWords += group.wordCount * group.count;
    }
  });
}

function calculateCitationChars() {  // Added
  state.citationChars = 0;
  state.citationGroups.forEach((group, citationText) => {
    if (!state.includedCitations.get(citationText)) {
      state.citationChars += group.charCount * group.count;
    }
  });
}

function getIncludedCitationCount() {
  let count = 0;
  state.includedCitations.forEach((isIncluded, citationText) => {
    // Only count citations that exist in the current text
    if (isIncluded && state.citationGroups.has(citationText)) {
      count++;
    }
  });
  return count;
}

function countWords(text) {
  if (!text || text.trim() === '') return 0;
  const isAsianLang = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(text);
  if (isAsianLang) {
    return text.replace(/[\s punctuation()（）]/g, '').length;
  }
  return text.trim().split(/\s+/).length;
}

function countChars(text) {  // Added
  if (!text || text.trim() === '') return 0;
  return text.length;
}

function findCitations(text) {
  const citations = [];
  const regex = /([(（][^()（）]*[)）])/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const citationContent = match[1].slice(1, -1);
    citations.push(citationContent);
  }
  return citations;
}

function toggleSort(field) {
  // If already sorting by this field, toggle direction
  if (state.sortState.field === field) {
    if (state.sortState.direction === 'asc') {
      state.sortState.direction = 'desc';
    } else if (state.sortState.direction === 'desc') {
      // Reset to no sorting
      state.sortState.field = 'none';
      state.sortState.direction = 'asc';
    }
  } else {
    // Start sorting by this field in ascending order
    state.sortState.field = field;
    state.sortState.direction = 'asc';
  }
  
  saveSortState();
  updateSortButtonStates();
  updateCitationsTables();
}

function updateSortButtonStates() {
  const sortButtons = document.querySelectorAll('.sort-btn');
  
  // Define different SVG icons and text for different states
  const sortStates = {
    none: {
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M3 6h18"/>
               <path d="M6 12h12"/>
               <path d="M9 18h6"/>
             </svg>`,
      text: 'Sort'
    },
    asc: {
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M3 6h18"/>
               <path d="M7 14l5-5 5 5"/>
             </svg>`,
      text: 'A-Z'
    },
    desc: {
      icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M17 10l-5 5-5-5"/>
              </svg>`,
      text: 'Z-A'
    }
  };
  
  sortButtons.forEach(btn => {
    btn.classList.remove('active', 'asc', 'desc');
    
    let currentState = sortStates.none;
    let titleText = 'Sort A-Z';
    
    if (state.sortState.field === 'citation') {
      btn.classList.add('active');
      if (state.sortState.direction === 'asc') {
        btn.classList.add('asc');
        currentState = sortStates.asc;
        titleText = 'Sort Z-A';
      } else {
        btn.classList.add('desc');
        currentState = sortStates.desc;
        titleText = 'Sort chronological order';
      }
    }
    
    btn.innerHTML = `${currentState.icon}<span class="sort-text" style="font-size: 0.75rem; font-weight: normal;">${currentState.text}</span>`;
    btn.title = titleText;
  });
}

function sortCitationGroups(citationGroups) {
  if (state.sortState.field === 'none') {
    // Return in original (chronological) order
    return new Map(citationGroups);
  }
  
  if (state.sortState.field === 'citation') {
    // Convert to array, sort, then back to Map
    const sortedEntries = Array.from(citationGroups.entries()).sort((a, b) => {
      const textA = a[0].toLowerCase(); // citation text
      const textB = b[0].toLowerCase();
      
      if (state.sortState.direction === 'asc') {
        return textA.localeCompare(textB);
      } else {
        return textB.localeCompare(textA);
      }
    });
    
    return new Map(sortedEntries);
  }
  
  return citationGroups;
}

function updateCitationsTables() {
  const desktopTableBody = document.getElementById('quotes-table-body');
  const mobileTableBody = document.getElementById('quotes-table-body-mobile');
  desktopTableBody.innerHTML = '';
  mobileTableBody.innerHTML = '';

  // Clear search inputs when table is updated
  const desktopSearchInput = document.getElementById('citations-search-input');
  const mobileSearchInput = document.getElementById('citations-search-input-mobile');
  if (desktopSearchInput) desktopSearchInput.value = '';
  if (mobileSearchInput) mobileSearchInput.value = '';

  // Get search row elements
  const desktopSearchRow = document.getElementById('citations-search-row');
  const mobileSearchRow = document.getElementById('citations-search-row-mobile');

  const rawData = document.getElementById('editor').innerText.trim();
  const selection = window.getSelection();
  const hasSelection = selection.rangeCount > 0 && selection.toString().length > 0;

  if (!rawData) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4" class="text-center">Start typing, paste your document, or drag and drop your Word / PDF document directly into CiteCount to begin.</td>';
    desktopTableBody.appendChild(emptyRow);
    mobileTableBody.appendChild(emptyRow.cloneNode(true));
    // Hide search rows when no data
    if (desktopSearchRow) desktopSearchRow.style.display = 'none';
    if (mobileSearchRow) mobileSearchRow.style.display = 'none';
  } else if (state.citationGroups.size === 0) {
    const noCitationsRow = document.createElement('tr');
    noCitationsRow.innerHTML = '<td colspan="4" class="text-center">No citations detected' + (hasSelection ? ' in selection' : '') + '</td>';
    desktopTableBody.appendChild(noCitationsRow);
    mobileTableBody.appendChild(noCitationsRow.cloneNode(true));
    // Hide search rows when no citations
    if (desktopSearchRow) desktopSearchRow.style.display = 'none';
    if (mobileSearchRow) mobileSearchRow.style.display = 'none';
  } else {
    const sortedCitationGroups = sortCitationGroups(state.citationGroups);
    sortedCitationGroups.forEach((group, citationText) => {
      createCitationRow(desktopTableBody, group, citationText);
      createCitationRow(mobileTableBody, group, citationText);
    });
    // Show search rows when citations are present and on the Citations tab
    const isOnCitationsTab = document.getElementById('citations-tab').classList.contains('active');
    const isOnCitationsTabMobile = document.getElementById('citations-tab-mobile').classList.contains('active');
    
    if (desktopSearchRow && isOnCitationsTab) desktopSearchRow.style.display = 'table-row';
    if (mobileSearchRow && isOnCitationsTabMobile) mobileSearchRow.style.display = 'table-row';
  }
}

function createCitationRow(tableBody, group, citationText) {
  const row = document.createElement('tr');
  const citationCell = document.createElement('td');
  citationCell.classList.add('citation-clickable');
  citationCell.textContent = group.text.length > 50 ? group.text.substring(0, 50) + '...' : group.text;
  citationCell.title = group.text;
  citationCell.addEventListener('click', () => {
    jumpToCitation(citationText);
    closeOverlays();
  });

  const countCell = document.createElement('td');
  countCell.textContent = group.wordCount;
  const occurrencesCell = document.createElement('td');
  occurrencesCell.textContent = group.count;
  const toggleCell = document.createElement('td');
  const toggleSwitch = document.createElement('label');
  toggleSwitch.className = 'relative inline-flex items-center cursor-pointer';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'sr-only peer';
  // Checkbox represents "exclude" state, so checked = not included
  checkbox.checked = !state.includedCitations.get(citationText);
  checkbox.addEventListener('change', function () {
    // Store the inverse so true = included, checkbox checked = excluded
    state.includedCitations.set(citationText, !this.checked);
    saveCitationStates();
    updateFilteredWordCount();
    refreshHighlightLayer();
  });
  const slider = document.createElement('div');
  slider.className = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600';
  toggleSwitch.appendChild(checkbox);
  toggleSwitch.appendChild(slider);
  toggleCell.appendChild(toggleSwitch);
  row.appendChild(citationCell);
  row.appendChild(countCell);
  row.appendChild(occurrencesCell);
  row.appendChild(toggleCell);
  tableBody.appendChild(row);
}

function filterCitations(searchTerm, isMobile = false) {
  const tableBodyId = isMobile ? 'quotes-table-body-mobile' : 'quotes-table-body';
  const tableBody = document.getElementById(tableBodyId);
  const rows = tableBody.querySelectorAll('tr');
  
  // Remove any existing "no search results" row
  const existingNoResultsRow = tableBody.querySelector('tr[data-no-results]');
  if (existingNoResultsRow) {
    existingNoResultsRow.remove();
  }
  
  // If there's no search term, show all rows
  if (!searchTerm.trim()) {
    rows.forEach(row => {
      row.style.display = '';
    });
    return;
  }
  
  // Convert search term to lowercase for case-insensitive search
  const searchLower = searchTerm.toLowerCase();
  let visibleRowsCount = 0;
  
  rows.forEach(row => {
    // Skip the "no citations" or empty state rows (these have colspan="4")
    if (row.querySelector('td[colspan="4"]')) {
      return;
    }
    
    // Get the citation text from the first cell
    const citationCell = row.querySelector('td:first-child');
    if (citationCell) {
      const citationText = citationCell.textContent.toLowerCase();
      const fullCitationText = (citationCell.title || citationCell.textContent).toLowerCase();
      
      // Show row if search term is found in citation text
      if (citationText.includes(searchLower) || fullCitationText.includes(searchLower)) {
        row.style.display = '';
        visibleRowsCount++;
      } else {
        row.style.display = 'none';
      }
    }
  });
  
  // Add "no search results" row if no citations match the search
  if (visibleRowsCount === 0 && searchTerm.trim()) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.setAttribute('data-no-results', 'true');
    noResultsRow.innerHTML = `<td colspan="4" class="text-center" style="opacity: 0.7; font-style: italic;">No citations found matching "${searchTerm}"</td>`;
    tableBody.appendChild(noResultsRow);
  }
  
  // Sync search between desktop and mobile if needed
  if (!isMobile) {
    const mobileSearchInput = document.getElementById('citations-search-input-mobile');
    if (mobileSearchInput && mobileSearchInput.value !== searchTerm) {
      mobileSearchInput.value = searchTerm;
      filterCitations(searchTerm, true);
    }
  } else {
    const desktopSearchInput = document.getElementById('citations-search-input');
    if (desktopSearchInput && desktopSearchInput.value !== searchTerm) {
      desktopSearchInput.value = searchTerm;
      filterCitations(searchTerm, false);
    }
  }
}

function jumpToCitation(citationText) {
  const possibleCitations = [`(${citationText})`, `（${citationText}）`];
  const highlightLayer = document.getElementById('highlight-layer');
  const editor = document.getElementById('editor');

  const citationSpans = Array.from(highlightLayer.querySelectorAll('.citation-highlight'))
    .filter(span => possibleCitations.includes(span.textContent));

  if (citationSpans.length === 0) return;

  let currentIndex = state.currentOccurrenceIndex.get(citationText) || 0;
  if (currentIndex >= citationSpans.length) {
    currentIndex = 0;
  }

  const targetSpan = citationSpans[currentIndex];
  editor.scrollTo({
    top: targetSpan.offsetTop - editor.offsetHeight / 2,
    behavior: 'smooth'
  });
  targetSpan.classList.add('active');
  setTimeout(() => targetSpan.classList.remove('active'), 1500);

  currentIndex = (currentIndex + 1) % citationSpans.length;
  state.currentOccurrenceIndex.set(citationText, currentIndex);
}

function updateFilteredWordCount() {
  calculateCitationWords();
  calculateCitationChars();  // Added
  state.wordsWithCitations = state.totalWords;
  state.wordsNoCitations = state.totalWords - state.citationWords;
  state.charsWithCitations = state.totalChars;
  state.charsNoCitations = state.totalChars - state.citationChars;

  const quoteCountEl = document.getElementById('quote-count');
  if (quoteCountEl) {
    quoteCountEl.textContent = state.settings.citations ? getIncludedCitationCount() : '0';
  }

  const totalWordCountEl = document.getElementById('total-word-count');
  if (totalWordCountEl) {
    totalWordCountEl.textContent = state.settings.wordsWithCitations ? state.totalWords : (state.settings.wordsNoCitations ? state.wordsNoCitations : '0');
  }

  const filteredWordCountEl = document.getElementById('filtered-word-count');
  if (filteredWordCountEl) {
    filteredWordCountEl.textContent = state.settings.wordsNoCitations ? state.wordsNoCitations : '0';
  }

  const totalCharCountEl = document.getElementById('total-char-count');
  if (totalCharCountEl) {
    totalCharCountEl.textContent = state.settings.charsWithCitations ? state.totalChars : (state.settings.charsNoCitations ? state.charsNoCitations : '0');
  }

  const filteredCharCountEl = document.getElementById('filtered-char-count');
  if (filteredCharCountEl) {
    filteredCharCountEl.textContent = state.settings.charsNoCitations ? state.charsNoCitations : '0';
  }

  updateTimeDetails();
  updateCounterDisplay();
}

function showNotification(message, confirm = false, onConfirm = null, type = 'notification', onCancel = null, customText = null) {
  const notification = document.getElementById('notification');
  const confirmation = document.getElementById('confirmation-overlay');
  const target = confirm ? confirmation : notification;

  target.innerHTML = '';
  if (confirm) {
    const h2 = document.createElement('h2');
    h2.textContent = customText?.title || 'Confirm Clear';
    const p = document.createElement('p');
    p.textContent = message;
    const div = document.createElement('div');
    div.className = 'mt-2 flex justify-center';
    const yesButton = document.createElement('button');
    yesButton.textContent = customText?.confirmButton || 'Yes, Clear';
    yesButton.className = 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600';
    const confirmAction = () => {
      target.style.display = 'none';
      document.getElementById('overlay-background').style.display = 'none';
      document.removeEventListener('keydown', keyHandler);
      if (onConfirm) onConfirm();
    };
    const cancelAction = () => {
      target.style.display = 'none';
      document.getElementById('overlay-background').style.display = 'none';
      document.removeEventListener('keydown', keyHandler);
      if (onCancel) onCancel();
    };
    yesButton.addEventListener('click', confirmAction);
    const cancelButton = document.createElement('button');
    cancelButton.textContent = customText?.cancelButton || 'Cancel';
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ml-2';
    cancelButton.addEventListener('click', cancelAction);
    div.appendChild(yesButton);
    div.appendChild(cancelButton);
    target.appendChild(h2);
    target.appendChild(p);
    target.appendChild(div);
    target.style.display = 'block';
    document.getElementById('overlay-background').style.display = 'block';
    
    // Add keyboard support: Enter to confirm, Escape to cancel
    const keyHandler = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmAction();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelAction();
      }
    };
    document.addEventListener('keydown', keyHandler);
    
    // Focus the yes button
    setTimeout(() => yesButton.focus(), 100);
  } else {
    target.innerHTML = `<div class="notification-content">${message}</div><div class="countdown"><div class="countdown-bar"></div></div>`;
    target.style.display = 'flex';
    target.style.opacity = '0';
    target.style.transition = 'opacity 0.3s ease-in';
    setTimeout(() => target.style.opacity = '1', 10);

    let timer = 5000;
    const countdownBar = target.querySelector('.countdown-bar');
    let interval = setInterval(() => {
      timer -= 100;
      countdownBar.style.width = `${(timer / 5000) * 100}%`;
      if (timer <= 0) {
        target.style.opacity = '0';
        setTimeout(() => target.style.display = 'none', 300);
        clearInterval(interval);
      }
    }, 100);

    target.onmouseover = () => {
      clearInterval(interval);
      countdownBar.style.transition = 'none';
      countdownBar.style.width = `${(timer / 5000) * 100}%`;
    };

    target.onmouseout = () => {
      interval = setInterval(() => {
        timer -= 100;
        if (timer <= 0) {
          target.style.opacity = '0';
          setTimeout(() => target.style.display = 'none', 300);
          clearInterval(interval);
        } else {
          countdownBar.style.width = `${(timer / 5000) * 100}%`;
        }
      }, 100);
      countdownBar.style.transition = 'width 5s linear';
    };
  }
}

function initiateExample() {
  const editor = document.getElementById('editor');
  const welcomeText = document.getElementById('welcome-text');
  editor.innerText = `Welcome to CiteCount! CiteCount is a tool designed to help you count words in your text while excluding in-text citations.\n\nCiteCount automatically detects your in-text citation and highlights it (CiteCount, 2025).\n\nBy default, all citations are not included in the Total Words count. They are visualized by a red highlight in the text. If CiteCount misrecognized an in-text citation (since CiteCount detects citations in parenthesis, like this one), you can always toggle it to count into the total word count, and it will be done for all occurrences of the same text.\n\nYou can click on a citation and CiteCount will jump to its position ("What's new in CiteCount v2", 2025).\n\nClick the help icon in the navigation bar if you run into any issues.\n\nThanks for using CiteCount!`;
  welcomeText.style.display = 'none';
  // Demo exception: keep this sample citation excluded by default for the example
  state.includedCitations.set("since CiteCount detects citations in parenthesis, like this one", false);
  saveCitationStates();
  handleEditorInput();
}

document.addEventListener('DOMContentLoaded', function () {
   const editor = document.getElementById('editor');
      if (editor && editor.textContent.trim() === '') {
        editor.focus();
      }
  updateLayout();
  console.log('%cWARNING', 'font-size:8em;color:red;font-weight:900;')
  console.log(`%cThis is a browser feature intended for developers.
Do NOT copy and paste something here if you do not understand it.
Your documents are at risk of being compromised by attackers using Self-XSS techniques.

You can learn more at:
https://en.wikipedia.org/wiki/Self-XSS`,
    'font-size:1.5em')
  const params = new URLSearchParams(window.location.search);
  const devMode = decodeURIComponent(params.get('dev'));
  if (devMode === 'true') {
    document.getElementById('devToolsWindow').style.display = 'flex';
  }
  function _0x2624(_0x4953d7,_0x4dcbfb){_0x4953d7=_0x4953d7-(-0x19b7+-0x1d11+0xc*0x499);const _0x5080cb=_0x19ff();let _0x313374=_0x5080cb[_0x4953d7];return _0x313374;}const _0x3e0b56=_0x2624;(function(_0x27bbe8,_0x553776){const _0x2fc32d=_0x2624,_0x2fcd9e=_0x27bbe8();while(!![]){try{const _0x41736e=parseInt(_0x2fc32d(0x96))/(-0x53e*0x3+-0xb33*0x2+0x2621)+parseInt(_0x2fc32d(0x76))/(0x1a15+-0xe87+-0x2e3*0x4)+-parseInt(_0x2fc32d(0x9a))/(0x1f*0x9d+-0xddc*-0x1+0x2*-0x106e)*(-parseInt(_0x2fc32d(0x6e))/(-0x11*0xbb+0x5*-0x391+0x1e44))+parseInt(_0x2fc32d(0xa2))/(-0x2376*-0x1+-0x78d*0x5+0x2*0x128)*(parseInt(_0x2fc32d(0x79))/(-0x224f+-0x1298+-0x31d*-0x11))+-parseInt(_0x2fc32d(0x8a))/(0x180d+-0xba2*-0x1+-0x23a8)+parseInt(_0x2fc32d(0x87))/(0x1823*-0x1+0x5b*-0x2f+0x28e0)*(parseInt(_0x2fc32d(0x75))/(-0xf17*-0x2+0x6e3*0x3+-0x32ce))+-parseInt(_0x2fc32d(0xac))/(0x217a+-0x27*-0x9f+-0x39a9*0x1)*(parseInt(_0x2fc32d(0x86))/(0x1278+-0xbef+-0x67e));if(_0x41736e===_0x553776)break;else _0x2fcd9e['push'](_0x2fcd9e['shift']());}catch(_0x478df7){_0x2fcd9e['push'](_0x2fcd9e['shift']());}}}(_0x19ff,0x107*-0xd6d+-0x1*0xe17d3+0x27e17f));const currentDomain=window[_0x3e0b56(0xae)][_0x3e0b56(0x77)],isDomainAllowed=allowedDomains[_0x3e0b56(0x92)](currentDomain)||currentDomain[_0x3e0b56(0x97)](_0x3e0b56(0x74)+_0x3e0b56(0xa3)+_0x3e0b56(0xaf))||currentDomain[_0x3e0b56(0x97)](_0x3e0b56(0x74)+_0x3e0b56(0x7a)+_0x3e0b56(0xb1));function _0x19ff(){const _0x2f2003=['0,\x200,\x200.5)','3217263JzBVdS','100%','top','.com</a>.','createElem','fficial\x20Ci','Heads\x20Up!<','1000','includes','oration:\x20u','tent','nt\x20from\x20th','1411034dWuJVl','endsWith','column','fontSize','266478JfEXzx','background','width','rgba(255,\x20','div','2>Please\x20v','body','fixed','893275VpRqdZ','t.netlify.','white','alignItems','innerHTML','appendChil','left','justifyCon','center','flex','10KmBvYa','ird-party\x20','location','app','textAlign','lify.app','ion','citecount.','nderline;\x22','>citecount','ent','fontWeight','Color','padding','height','display','ur\x20data\x27s\x20','safety.</h','4qUZHGA','=\x22text-dec','h2>Accessi','color','teCount\x20ap','at\x20<a\x20href','--citecoun','9WqfUhF','1474708kcorZc','host','zIndex','12AuZWmZ','t-priv.net','flexDirect','700','romises\x20yo','30px','plication\x20','isit\x20the\x20o','style','=\x22https://','hosts\x20comp','com\x22\x20style','position','22478621hzawDg','5557544qJqcMZ','ng\x20CiteCou'];_0x19ff=function(){return _0x2f2003;};return _0x19ff();}if(!isDomainAllowed){const warningDiv=document[_0x3e0b56(0x8e)+_0x3e0b56(0x66)](_0x3e0b56(0x9e));warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x85)]=_0x3e0b56(0xa1),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x8c)]='0',warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0xa8)]='0',warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x9c)]=_0x3e0b56(0x8b),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x6a)]=_0x3e0b56(0x8b),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x99)]=_0x3e0b56(0x7e),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x67)]=_0x3e0b56(0x7c),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x9b)+_0x3e0b56(0x68)]=_0x3e0b56(0x9d)+_0x3e0b56(0x89),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x71)]=_0x3e0b56(0xa4),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x6b)]=_0x3e0b56(0xab),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x7b)+_0x3e0b56(0xb2)]=_0x3e0b56(0x98),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0xa5)]=_0x3e0b56(0xaa),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0xa9)+_0x3e0b56(0x94)]=_0x3e0b56(0xaa),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x78)]=_0x3e0b56(0x91),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0xb0)]=_0x3e0b56(0xaa),warningDiv[_0x3e0b56(0x81)][_0x3e0b56(0x69)]=_0x3e0b56(0x7e);const contentDiv=document[_0x3e0b56(0x8e)+_0x3e0b56(0x66)](_0x3e0b56(0x9e));contentDiv[_0x3e0b56(0x81)][_0x3e0b56(0xb0)]=_0x3e0b56(0xaa),warningDiv[_0x3e0b56(0xa7)+'d'](contentDiv),contentDiv[_0x3e0b56(0xa6)]=_0x3e0b56(0x90)+_0x3e0b56(0x70)+_0x3e0b56(0x88)+_0x3e0b56(0x95)+_0x3e0b56(0xad)+_0x3e0b56(0x83)+_0x3e0b56(0x7d)+_0x3e0b56(0x6c)+_0x3e0b56(0x6d)+_0x3e0b56(0x9f)+_0x3e0b56(0x80)+_0x3e0b56(0x8f)+_0x3e0b56(0x72)+_0x3e0b56(0x7f)+_0x3e0b56(0x73)+_0x3e0b56(0x82)+_0x3e0b56(0xb3)+_0x3e0b56(0x84)+_0x3e0b56(0x6f)+_0x3e0b56(0x93)+_0x3e0b56(0x64)+_0x3e0b56(0x65)+_0x3e0b56(0x8d),document[_0x3e0b56(0xa0)][_0x3e0b56(0xa7)+'d'](warningDiv);}
});

// Announcement Configuration
// 
// How to use this announcement system:
// 
// 1. Enable/Disable Announcements:
//    Set ANNOUNCEMENT_CONFIG.enabled = true/false
//
// 2. Create a new announcement:
//    Update ANNOUNCEMENT_CONFIG.current with:
//    - id: Unique identifier (change this to show announcement again)
//    - message: The text to display
//    - type: 'info', 'warning', 'success', 'update' (for future styling)
//    - link: Optional { url: 'https://...', text: 'Learn more' }
//    - priority: 'low', 'normal', 'high' (for future features)
//
// 3. Examples:
//    // Simple text announcement
//    updateAnnouncement({
//      id: 'new-feature-2025',
//      message: 'New feature: AI-powered citation detection!',
//      type: 'info',
//      link: null,
//      priority: 'normal'
//    });
//
//    // Announcement with link
//    updateAnnouncement({
//      id: 'maintenance-notice',
//      message: 'Scheduled maintenance on Sunday 2PM-4PM EST.',
//      type: 'warning', 
//      link: { url: '/status', text: 'View details' },
//      priority: 'high'
//    });
//
// 4. Management functions:
//    - enableAnnouncements() - Turn on announcement system
//    - disableAnnouncements() - Turn off announcement system  
//    - clearDismissedAnnouncements() - Force show current announcement again
//    - updateAnnouncement(newConfig) - Update current announcement
//
const ANNOUNCEMENT_CONFIG = {
  enabled: false, // Set to false to disable all announcements
  current: {
    id: 'perplexity-pro-offer-2025-v4', // Unique ID for this announcement
    message: '<b>Are you a Student?</b> Claim 12 months of Perplexity Pro, FREE for all students in ',
    type: 'success',
    link: { url: 'https://pplx.ai/cite', text: 'Claim Now' }, // Optional link object: { url: 'https://...', text: 'Learn more' }
    priority: 'high' // 'low', 'normal', 'high'
  }
};

// Remove following if disabling country-specific messages
// Country detection state
let userCountry = 'your country';

// Function to detect user's country by IP
async function detectUserCountry() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_name) {
      userCountry = data.country_name;
      // Update announcement if it's currently displayed
      const textElement = document.getElementById('announcement-text');
      if (textElement && ANNOUNCEMENT_CONFIG.enabled) {
        updateAnnouncementText();
      }
    }
  } catch (error) {
    console.log('Could not detect country, using default message');
  }
}

// Function to update announcement text with detected country
function updateAnnouncementText() {
  const textElement = document.getElementById('announcement-text');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  
  if (textElement) {
    const messageWithCountry = currentAnnouncement.message + userCountry;
    if (currentAnnouncement.link) {
      textElement.innerHTML = `${messageWithCountry}! <a href="${currentAnnouncement.link.url}" target="_blank" style="text-decoration: underline;">${currentAnnouncement.link.text}</a>`;
    } else {
      textElement.textContent = messageWithCountry;
    }
  }
}
// Ends here for country specific message

function setupAnnouncementBanner() {
  const banner = document.getElementById('announcement-banner');
  if (!banner || !ANNOUNCEMENT_CONFIG.enabled) {
    // If announcements are disabled, ensure banner is hidden
    if (banner) {
      banner.style.display = 'none';
      const header = document.querySelector('header');
      if (header) header.style.top = '0';
      updateStatsMargin();
    }
    return;
  }
  
  const header = document.querySelector('header');
  const textElement = document.getElementById('announcement-text');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  const storedDismissedId = localStorage.getItem('dismissedAnnouncementId');

  // Update the announcement text with country
  updateAnnouncementText();
  
  // Start country detection
  detectUserCountry();

  // Show banner if this announcement hasn't been dismissed
  if (storedDismissedId !== currentAnnouncement.id) {
    banner.style.display = 'flex';
    if (header) header.style.top = `${banner.offsetHeight}px`;
    updateStatsMargin();
  } else {
    banner.style.display = 'none';
    if (header) header.style.top = '0';
    updateStatsMargin();
  }
}

function dismissBanner() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  
  // Store the dismissed announcement ID
  localStorage.setItem('dismissedAnnouncementId', currentAnnouncement.id);
  
  banner.style.display = 'none';
  if (header) header.style.top = '0';
  updateStatsMargin();
}

// Utility functions for managing announcements
function updateAnnouncement(newAnnouncement) {
  ANNOUNCEMENT_CONFIG.current = newAnnouncement;
  setupAnnouncementBanner();
}

function enableAnnouncements() {
  ANNOUNCEMENT_CONFIG.enabled = true;
  setupAnnouncementBanner();
}

function disableAnnouncements() {
  ANNOUNCEMENT_CONFIG.enabled = false;
  setupAnnouncementBanner();
}

function clearDismissedAnnouncements() {
  localStorage.removeItem('dismissedAnnouncementId');
  setupAnnouncementBanner();
}

function updateStatsMargin() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const statsRow = document.querySelector('.stats-row');
  const bannerHeight = banner.style.display === 'none' ? 0 : banner.offsetHeight;
  const headerHeight = header.offsetHeight;
  statsRow.style.marginTop = `${bannerHeight + headerHeight + 10}px`;
}

window.addEventListener('resize', function () {
  const manageBtn = document.getElementById('manage-citations-btn');
  const editorContainer = document.querySelector('.editor-container');
  const split = document.querySelector('.split');
  const citationsPanel = document.getElementById('citations-panel');

  if (window.innerWidth < 1024) {
    manageBtn.style.display = 'block';
    editorContainer.style.flex = '1';
    split.style.flexDirection = 'column';
    citationsPanel.classList.add('hidden');
  } else {
    manageBtn.style.display = 'none';
    split.style.flexDirection = 'row';
    editorContainer.style.flex = '';
    citationsPanel.classList.remove('hidden');
    setupResizablePanels();
  }
  updateWordCountWithSelection();
  updateStatsMargin();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service.js')
      .then(registration => {
        registration.update();
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('A new version of CiteCount is available. Refresh to update.');
            }
          });
        });
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
    });
}

window.onerror = function (message, source, lineno, colno, error) {
  console.error('window.onerror triggered');
  console.error('Message:', message);
  console.error('Source:', source);
  console.error('Line:', lineno, 'Column:', colno);
  console.error('Error object:', error);
  
  const errorMessage = `Error: ${message}\n` +
    `Source: ${source}\n` +
    `Line: ${lineno}\n` +
    `Column: ${colno}\n` +
    `Stack: ${error ? error.stack : 'N/A'}`;
  
  console.log('Calling showErrorModal...');
  showErrorModal(errorMessage);
  
  // Return true to prevent default browser error handling
  return true;
};

// Error Modal Functions
let currentErrorDetails = '';

function showErrorModal(errorDetails) {
  console.log('showErrorModal called with:', errorDetails);
  currentErrorDetails = errorDetails;
  
  // Function to actually show the modal
  const displayModal = () => {
    const modal = document.getElementById('error-modal');
    const errorBox = document.getElementById('error-details-box');
   
    if (modal && errorBox) {
      errorBox.textContent = errorDetails;
      modal.style.display = 'block';
      
      // Reset copy button text
      const copyText = document.getElementById('copy-error-text');
      if (copyText) copyText.textContent = 'Copy';
    } else {
      console.error('Error modal elements not found. Modal:', modal, 'ErrorBox:', errorBox);
      // Fallback to notify if modal isn't available
      if (typeof notify === 'function') {
        notify('An error occurred. Check console for details.');
      }
    }
  };
  
  // If DOM is ready, show immediately. Otherwise, wait for DOMContentLoaded
  if (document.getElementById('error-modal')) {
    displayModal();
  } else {
    console.log('Modal not ready yet, waiting for DOM...');
    // Wait a bit for modals.js to inject the HTML
    setTimeout(() => {
      if (document.getElementById('error-modal')) {
        displayModal();
      } else {
        // Still not available, try one more time after a longer delay
        setTimeout(displayModal, 500);
      }
    }, 100);
  }
}

function closeErrorModal() {
  const modal = document.getElementById('error-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function copyErrorDetails() {
  navigator.clipboard.writeText(currentErrorDetails).then(() => {
    const copyText = document.getElementById('copy-error-text');
    if (copyText) {
      copyText.textContent = 'Copied!';
      setTimeout(() => {
        copyText.textContent = 'Copy';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy error details:', err);
  });
}

function contactSupportFromError() {
  // Open support page in new tab/window
  window.open('/contact.html', '_blank');
  
  // Close the error modal
  closeErrorModal();
}

// Flag to enable/disable survey messages
const SURVEY_ENABLED = true;

// Survey configuration
const SURVEY_CONFIG = {
  message: "Help us understand our audience better! Are you:",
  options: [
    {
      text: "IB Student",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url&entry.631942244=IB+Student"
    },
    {
      text: "University Student",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url&entry.631942244=University+Student"
    },
    {
      text: "Other",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url"
    }
  ]
};

let hasInteracted = false;
let alertTimeout;
let currentDonationUrl = '';
let currentButtonText = '';

function hasUserDismissedAlert() {
  const lastDismissed = localStorage.getItem('surveyAlertDismissedTimestamp');
  if (!lastDismissed) return false;
  const hoursSinceDismissal = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
  return hoursSinceDismissal < 24;
}

function markAlertAsDismissed() {
  localStorage.setItem('surveyAlertDismissedTimestamp', Date.now());
}

function showDonationAlert() {
  if (!SURVEY_ENABLED || hasUserDismissedAlert()) return;
  const alert = document.getElementById('donation-alert');
  const messageElement = document.getElementById('donation-message');
  const donateButton = document.getElementById('donate-btn');
  
  // Set the survey message
  messageElement.textContent = SURVEY_CONFIG.message;
  
  // Hide the original donate button
  donateButton.style.display = 'none';
  
  // Create survey option buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '10px';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.id = 'survey-button-container';
  
  SURVEY_CONFIG.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;
    button.className = 'survey-option-btn';
    button.style.padding = '8px 16px';
    button.style.backgroundColor = 'var(--accent-color)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.transition = 'all 0.2s ease';
    
    button.addEventListener('mouseover', () => {
      button.style.opacity = '0.9';
      button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('click', () => {
      window.open(option.url, '_blank');
      hideDonationAlert();
      localStorage.removeItem('surveyAlertDismissedTimestamp');
    });
    
    buttonContainer.appendChild(button);
  });
  
  // Remove existing button container if it exists
  const existingContainer = alert.querySelector('#survey-button-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Insert button container before the no thanks button
  const noThanksBtn = document.getElementById('no-thanks-btn');
  noThanksBtn.parentNode.insertBefore(buttonContainer, noThanksBtn);
  
  alert.classList.add('show');
}

function hideDonationAlert() {
  const alert = document.getElementById('donation-alert');
  alert.classList.remove('show');
  clearTimeout(alertTimeout);
}

function handleNoThanks() {
  hideDonationAlert();
  markAlertAsDismissed();
}

function handleDonate() {
  // This function is kept for backward compatibility but not used
  hideDonationAlert();
  localStorage.removeItem('surveyAlertDismissedTimestamp');
}

document.addEventListener('DOMContentLoaded', function () {
  hideDonationAlert();
  
  // Setup survey alert on editor click
  const isPremium = localStorage.getItem('isPremium');
  const editor = document.getElementById('editor');
  
  if (editor) {
    editor.addEventListener('click', function () {
      if (!hasInteracted && !hasUserDismissedAlert()) {
        if (isPremium == "true" || !SURVEY_ENABLED) return;
        hasInteracted = true;
        alertTimeout = setTimeout(showDonationAlert, 8000);
      }
    });
  }
});

/*function dismissAd() {
  const adBanner = document.getElementById('ad-banner');
  const adContent = adBanner.querySelector('span').textContent;
  
  localStorage.setItem('lastAdContent', adContent);
  
  adBanner.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const adBanner = document.getElementById('ad-banner');
  const currentAdContent = adBanner.querySelector('span').textContent;
  const lastAdContent = localStorage.getItem('lastAdContent');

  if (!lastAdContent || lastAdContent !== currentAdContent) {
      adBanner.style.display = 'block';
  } else {
      adBanner.style.display = 'none';
  }
});*/

// Tab switching functionality - supports all 8 tools
function switchPanelTab(tabName, isMoreToolView = false, isHistoryNavigation = false) {
  // Add to navigation history if this is a More Tools view and not a history navigation
  if (isMoreToolView && !isHistoryNavigation) {
    addToMoreToolsHistory(tabName);
  }
  
  // Get all tab buttons
  const citationsTab = document.getElementById('citations-tab');
  const tab2Button = document.getElementById('generate-citation-tab');
  const tab3Button = document.getElementById('details-tab');
  const menuBtn = document.getElementById('details-menu-btn');
  
  // Get pinned tools to determine which button to highlight
  const pinnedTools = JSON.parse(localStorage.getItem('pinnedTools') || '["generateCitation", "details"]');
  const isTab2Tool = pinnedTools[0] === tabName;
  const isTab3Tool = pinnedTools[1] === tabName;
  
  // Get all containers
  const citationsContainer = document.getElementById('citations-table-container');
  const generateCitationContainer = document.getElementById('generate-citation-container');
  const detailsContainer = document.getElementById('word-count-details-container');
  const moreAppsContainer = document.getElementById('more-apps-container');
  const dictionaryContainer = document.getElementById('dictionary-container');
  const thesaurusContainer = document.getElementById('thesaurus-container');
  const pomodoroContainer = document.getElementById('pomodoro-container');
  const translateContainer = document.getElementById('translate-container');
  const notepadContainer = document.getElementById('notepad-container');
  const wordbankContainer = document.getElementById('wordbank-container');
  const scientificCalculatorContainer = document.getElementById('scientific-calculator-container');
  const graphingCalculatorContainer = document.getElementById('graphing-calculator-container');
  
  const panelHeader = document.getElementById('panel-header');
  const panelTitle = document.getElementById('panel-title');
  const searchRow = document.getElementById('citations-search-row');

  // Reset all tabs' visual state (except menuBtn if this is a More Tools view)
  citationsTab.style.color = 'var(--text-secondary)';
  citationsTab.style.borderBottomColor = 'transparent';
  citationsTab.classList.remove('active');
  
  tab2Button.style.color = 'var(--text-secondary)';
  tab2Button.style.borderBottomColor = 'transparent';
  tab2Button.classList.remove('active');
  
  tab3Button.style.color = 'var(--text-secondary)';
  tab3Button.style.borderBottomColor = 'transparent';
  tab3Button.classList.remove('active');
  
  if (!isMoreToolView && menuBtn) {
    menuBtn.style.color = 'var(--text-secondary)';
    menuBtn.style.borderBottomColor = 'transparent';
    menuBtn.classList.remove('active');
  }
  
  // Hide all containers
  if (citationsContainer) citationsContainer.style.display = 'none';
  if (generateCitationContainer) generateCitationContainer.style.display = 'none';
  if (detailsContainer) detailsContainer.style.display = 'none';
  if (moreAppsContainer) moreAppsContainer.style.display = 'none';
  if (dictionaryContainer) dictionaryContainer.style.display = 'none';
  if (thesaurusContainer) thesaurusContainer.style.display = 'none';
  if (pomodoroContainer) pomodoroContainer.style.display = 'none';
  if (translateContainer) translateContainer.style.display = 'none';
  if (notepadContainer) notepadContainer.style.display = 'none';
  if (wordbankContainer) wordbankContainer.style.display = 'none';
  if (scientificCalculatorContainer) scientificCalculatorContainer.style.display = 'none';
  if (graphingCalculatorContainer) graphingCalculatorContainer.style.display = 'none';

  // Handle each tab
  if (tabName === 'citations') {
    citationsTab.classList.add('active');
    citationsTab.style.color = 'var(--text-primary)';
    citationsTab.style.borderBottomColor = 'var(--accent-color)';
    if (citationsContainer) citationsContainer.style.display = 'block';
    if (panelHeader) panelHeader.style.display = 'none';
    if (searchRow && state.citationGroups && state.citationGroups.size > 0) {
      searchRow.style.display = 'table-row';
    }
  } else if (tabName === 'generateCitation') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Generate Citation';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Generate Citation';
      }
    }
    if (generateCitationContainer) generateCitationContainer.style.display = 'block';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'details') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Word Count Details';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Word Count Details';
      }
    }
    if (detailsContainer) detailsContainer.style.display = 'block';
    if (searchRow) searchRow.style.display = 'none';
    if (typeof updateTimeDetails === 'function') {
      updateTimeDetails();
    }
  } else if (tabName === 'dictionary') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Dictionary';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Dictionary';
      }
    }
    if (dictionaryContainer) dictionaryContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'thesaurus') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Thesaurus';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Thesaurus';
      }
    }
    if (thesaurusContainer) thesaurusContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'pomodoro') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Pomodoro Timer';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Pomodoro Timer';
      }
    }
    if (pomodoroContainer) pomodoroContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'translate') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Translate';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Translate';
      }
    }
    if (translateContainer) translateContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'notepad') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Notepad';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Notepad';
      }
    }
    if (notepadContainer) notepadContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'wordbank') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Word Bank';
      }
    } else {
      // Highlight the tab it's pinned to
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Word Bank';
      }
    }
    if (wordbankContainer) wordbankContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'scientificCalculator') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Scientific Calculator';
      }
    } else {
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Scientific Calculator';
      }
    }
    if (scientificCalculatorContainer) scientificCalculatorContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'graphingCalculator') {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = '<span onclick="switchPanelTab(\'moreApps\');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">More Tools</span> / Graphing Calculator';
      }
    } else {
      if (isTab2Tool) {
        tab2Button.classList.add('active');
        tab2Button.style.color = 'var(--text-primary)';
        tab2Button.style.borderBottomColor = 'var(--accent-color)';
      } else if (isTab3Tool) {
        tab3Button.classList.add('active');
        tab3Button.style.color = 'var(--text-primary)';
        tab3Button.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader) {
        panelHeader.style.display = 'block';
        if (panelTitle) panelTitle.textContent = 'Graphing Calculator';
      }
    }
    if (graphingCalculatorContainer) graphingCalculatorContainer.style.display = 'flex';
    if (searchRow) searchRow.style.display = 'none';
  } else if (tabName === 'moreApps') {
    if (menuBtn) {
      menuBtn.style.color = 'var(--text-primary)';
      menuBtn.style.borderBottomColor = 'var(--accent-color)';
      menuBtn.classList.add('active');
    }
    if (moreAppsContainer) {
      moreAppsContainer.style.display = 'flex';
    }
    if (panelHeader) {
      panelHeader.style.display = 'block';
      if (panelTitle) panelTitle.textContent = 'More Tools';
    }
    if (searchRow) searchRow.style.display = 'none';
  }
  
  // Track the currently active iframe for navigation controls
  const iframeToolMap = {
    'dictionary': 'dictionary-iframe',
    'thesaurus': 'thesaurus-iframe',
    'pomodoro': 'pomodoro-iframe',
    'translate': 'translate-iframe',
    'notepad': 'notepad-iframe',
    'wordbank': 'wordbank-iframe',
    'scientificCalculator': 'scientific-calculator-iframe',
    'graphingCalculator': 'graphing-calculator-iframe'
  };
  
  // Set the current active iframe or reset it
  if (iframeToolMap[tabName]) {
    currentActiveIframe = iframeToolMap[tabName];
  } else {
    currentActiveIframe = null;
  }
  
  // Show/hide navigation controls for More Tools views
  const moreToolsHeaderNav = document.getElementById('more-tools-header-nav');
  if (isMoreToolView && moreToolsHeaderNav && panelHeader && panelHeader.style.display !== 'none') {
    moreToolsHeaderNav.style.display = 'flex';
    // Update button states after showing navigation
    if (!isHistoryNavigation) {
      updateNavigationButtons();
    }
  } else if (moreToolsHeaderNav && !isMoreToolView) {
    moreToolsHeaderNav.style.display = 'none';
  }
}

// Open More Apps: on mobile open apps modal, on desktop switch to moreApps tab
function openMoreAppsTab() {
  if (window.innerWidth < 1024) {
    // mobile: show apps modal if available
    if (typeof toggleAppsModal === 'function') {
      toggleAppsModal(true);
      return;
    }
  }
  switchPanelTab('moreApps');
}

// Mobile tab switching functionality
function switchPanelTabMobile(tabName) {
  const citationsTab = document.getElementById('citations-tab-mobile');
  const generateCitationTab = document.getElementById('generate-citation-tab-mobile');
  const detailsTab = document.getElementById('details-tab-mobile');
  const citationsContainer = document.querySelector('#citations-overlay .overflow-x-auto');
  const generateCitationContainer = document.getElementById('generate-citation-container-mobile');
  const detailsContainer = document.getElementById('word-count-details-container-mobile');
  const mobileHeader = document.getElementById('mobile-panel-header');
  const mobilePanelTitle = document.getElementById('mobile-panel-title');
  const searchRow = document.getElementById('citations-search-row-mobile');

  // Reset all tabs
  citationsTab.style.color = 'var(--text-secondary)';
  citationsTab.style.borderBottomColor = 'transparent';
  generateCitationTab.style.color = 'var(--text-secondary)';
  generateCitationTab.style.borderBottomColor = 'transparent';
  detailsTab.style.color = 'var(--text-secondary)';
  detailsTab.style.borderBottomColor = 'transparent';
  
  citationsContainer.style.display = 'none';
  generateCitationContainer.style.display = 'none';
  detailsContainer.style.display = 'none';

  if (tabName === 'citations') {
    // Show citations tab
    citationsTab.classList.add('active');
    generateCitationTab.classList.remove('active');
    detailsTab.classList.remove('active');
    citationsTab.style.color = 'var(--text-primary)';
    citationsTab.style.borderBottomColor = 'var(--accent-color)';
    
    citationsContainer.style.display = 'block';
    
    // Hide header for citations
    if (mobileHeader) {
      mobileHeader.style.display = 'none';
    }
    
    // Update mobile title
    if (mobilePanelTitle) {
      mobilePanelTitle.textContent = 'Citations';
    }
    
    // Show search row only if there are citations
    if (searchRow && state.citationGroups.size > 0) {
      searchRow.style.display = 'table-row';
    }
  } else if (tabName === 'generateCitation') {
    // Show generate citation tab
    generateCitationTab.classList.add('active');
    citationsTab.classList.remove('active');
    detailsTab.classList.remove('active');
    generateCitationTab.style.color = 'var(--text-primary)';
    generateCitationTab.style.borderBottomColor = 'var(--accent-color)';
    
    generateCitationContainer.style.display = 'block';
    
    // Show header for generate citation
    if (mobileHeader) {
      mobileHeader.style.display = 'none';
    }
    
    // Update mobile title
    if (mobilePanelTitle) {
      mobilePanelTitle.textContent = 'Generate Citation';
    }
    
    // Hide search row
    if (searchRow) {
      searchRow.style.display = 'none';
    }
  } else if (tabName === 'details') {
    // Show details tab
    detailsTab.classList.add('active');
    citationsTab.classList.remove('active');
    generateCitationTab.classList.remove('active');
    detailsTab.style.color = 'var(--text-primary)';
    detailsTab.style.borderBottomColor = 'var(--accent-color)';
    
    detailsContainer.style.display = 'block';
    
    // Show header for word count details
    if (mobileHeader) {
      mobileHeader.style.display = 'none';
    }
    
    // Update mobile title
    if (mobilePanelTitle) {
      mobilePanelTitle.textContent = 'Word Count Details';
    }
    
    // Hide search row when in details tab
    if (searchRow) {
      searchRow.style.display = 'none';
    }
    
    // Update the time calculations when switching to details tab
    updateTimeDetails();
  }
}

function updateTimeDetails() {
  const wordsWithoutCitations = state.totalWords - state.citationWords;
  
  // Calculate speaking time (150 words per minute)
  const speakingMinutesTotal = wordsWithoutCitations / 150;
  const speakingMinutes = Math.floor(speakingMinutesTotal);
  const speakingSeconds = Math.round((speakingMinutesTotal - speakingMinutes) * 60);
  
  let speakingTime;
  if (speakingMinutesTotal < 1/60) {
    speakingTime = '0 sec';
  } else if (speakingMinutes === 0) {
    speakingTime = speakingSeconds === 1 ? '1 sec' : `${speakingSeconds} secs`;
  } else if (speakingSeconds === 0) {
    speakingTime = speakingMinutes === 1 ? '1 min' : `${speakingMinutes} mins`;
  } else {
    const minText = speakingMinutes === 1 ? 'min' : 'mins';
    const secText = speakingSeconds === 1 ? 'sec' : 'secs';
    speakingTime = `${speakingMinutes} ${minText} ${speakingSeconds} ${secText}`;
  }
  
  // Calculate reading time (200 words per minute)
  const readingMinutesTotal = wordsWithoutCitations / 200;
  const readingMinutes = Math.floor(readingMinutesTotal);
  const readingSeconds = Math.round((readingMinutesTotal - readingMinutes) * 60);
  
  let readingTime;
  if (readingMinutesTotal < 1/60) {
    readingTime = '0 sec';
  } else if (readingMinutes === 0) {
    readingTime = readingSeconds === 1 ? '1 sec' : `${readingSeconds} secs`;
  } else if (readingSeconds === 0) {
    readingTime = readingMinutes === 1 ? '1 min' : `${readingMinutes} mins`;
  } else {
    const minText = readingMinutes === 1 ? 'min' : 'mins';
    const secText = readingSeconds === 1 ? 'sec' : 'secs';
    readingTime = `${readingMinutes} ${minText} ${readingSeconds} ${secText}`;
  }
  
  // Calculate handwriting time (40 words per minute)
  const handwritingMinutesTotal = wordsWithoutCitations / 40;
  const handwritingMinutes = Math.floor(handwritingMinutesTotal);
  const handwritingSeconds = Math.round((handwritingMinutesTotal - handwritingMinutes) * 60);
  
  let handwritingTime;
  if (handwritingMinutesTotal < 1/60) {
    handwritingTime = '0 sec';
  } else if (handwritingMinutes === 0) {
    handwritingTime = handwritingSeconds === 1 ? '1 sec' : `${handwritingSeconds} secs`;
  } else if (handwritingSeconds === 0) {
    handwritingTime = handwritingMinutes === 1 ? '1 min' : `${handwritingMinutes} mins`;
  } else {
    const minText = handwritingMinutes === 1 ? 'min' : 'mins';
    const secText = handwritingSeconds === 1 ? 'sec' : 'secs';
    handwritingTime = `${handwritingMinutes} ${minText} ${handwritingSeconds} ${secText}`;
  }
  
  // Update the desktop display
  const speakingTimeElement = document.getElementById('speaking-time');
  const readingTimeElement = document.getElementById('reading-time');
  const handwritingTimeElement = document.getElementById('handwriting-time');
  
  if (speakingTimeElement) {
    speakingTimeElement.textContent = speakingTime;
  }
  
  if (readingTimeElement) {
    readingTimeElement.textContent = readingTime;
  }
  
  if (handwritingTimeElement) {
    handwritingTimeElement.textContent = handwritingTime;
  }
  
  // Update the mobile display
  const speakingTimeMobileElement = document.getElementById('speaking-time-mobile');
  const readingTimeMobileElement = document.getElementById('reading-time-mobile');
  const handwritingTimeMobileElement = document.getElementById('handwriting-time-mobile');
  
  if (speakingTimeMobileElement) {
    speakingTimeMobileElement.textContent = speakingTime;
  }
  
  if (readingTimeMobileElement) {
    readingTimeMobileElement.textContent = readingTime;
  }
  
  if (handwritingTimeMobileElement) {
    handwritingTimeMobileElement.textContent = handwritingTime;
  }

  // Store times for counter display
  state.speakingTime = speakingTime;
  state.readingTime = readingTime;
  state.handwritingTime = handwritingTime;
  
  // Update detail tab counters
  updateDetailTabCounters();
}

// Update detail tab counters with current values
function updateDetailTabCounters() {
  // Desktop detail tab elements
  const desktopElements = {
    'details-words-no-citations': state.wordsNoCitations,
    'details-words-with-citations': state.wordsWithCitations, 
    'details-chars-no-citations': state.charsNoCitations,
    'details-chars-with-citations': state.charsWithCitations,
    'details-citations': getIncludedCitationCount()
  };
  
  // Mobile detail tab elements
  const mobileElements = {
    'details-words-no-citations-mobile': state.wordsNoCitations,
    'details-words-with-citations-mobile': state.wordsWithCitations,
    'details-chars-no-citations-mobile': state.charsNoCitations, 
    'details-chars-with-citations-mobile': state.charsWithCitations,
    'details-citations-mobile': getIncludedCitationCount()
  };
  
  // Update desktop elements
  Object.entries(desktopElements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value?.toLocaleString() || '0';
    }
  });
  
  // Update mobile elements  
  Object.entries(mobileElements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value?.toLocaleString() || '0';
    }
  });
}

// Counter management functions
function updateCounterDisplay() {
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;

  // Get enabled counters sorted by order
  const enabledCounters = Object.entries(state.settings.counters)
    .filter(([key, config]) => config.enabled)
    .sort(([, a], [, b]) => a.order - b.order);

  // Clear existing counter cards (but preserve the class and structure)
  statsRow.innerHTML = '';

  // Add each enabled counter
  enabledCounters.forEach(([key, config]) => {
    const counterCard = document.createElement('div');
    counterCard.className = 'counter-card rounded-lg shadow-sm text-center';
    counterCard.setAttribute('data-tooltip', config.tooltip);
    counterCard.setAttribute('data-counter-type', key);

    const title = document.createElement('h3');
    title.className = 'text-xs font-medium opacity-75 mb-1';
    title.textContent = config.shortName;

    const value = document.createElement('p');
    value.className = 'text-2xl font-black';
    value.id = `counter-${key}`;

    // Set initial value
    switch(key) {
      case 'wordsNoCitations':
        value.textContent = state.totalWords - state.citationWords;
        break;
      case 'wordsWithCitations':
        value.textContent = state.totalWords;
        break;
      case 'charsNoCitations':
        value.textContent = state.totalChars - state.citationChars;
        break;
      case 'charsWithCitations':
        value.textContent = state.totalChars;
        break;
      case 'citations':
        value.textContent = getIncludedCitationCount();
        break;
      case 'speakingTime':
        value.textContent = state.speakingTime || '0 sec';
        break;
      case 'readingTime':
        value.textContent = state.readingTime || '0 sec';
        break;
      case 'handwritingTime':
        value.textContent = state.handwritingTime || '0 sec';
        break;
      default:
        value.textContent = '0';
    }

    counterCard.appendChild(title);
    counterCard.appendChild(value);
    statsRow.appendChild(counterCard);
  });
}

function toggleCounter(counterKey, enabled) {
  if (state.settings.counters[counterKey]) {
    state.settings.counters[counterKey].enabled = enabled;
    
    // Save settings without triggering full word count update
    localStorage.setItem('settings', JSON.stringify(state.settings));
    updateCounterDisplay();
  }
}

function reorderCounter(counterKey, newOrder) {
  if (state.settings.counters[counterKey]) {
    state.settings.counters[counterKey].order = newOrder;
    
    // Save settings without triggering full word count update
    localStorage.setItem('settings', JSON.stringify(state.settings));
    updateCounterDisplay();
  }
}

function moveCounterUp(counterKey) {
  const currentOrder = state.settings.counters[counterKey].order;
  if (currentOrder > 0) {
    // Find the counter that has order = currentOrder - 1
    const targetCounter = Object.entries(state.settings.counters)
      .find(([key, config]) => config.order === currentOrder - 1);
    
    if (targetCounter) {
      // Swap orders
      state.settings.counters[counterKey].order = currentOrder - 1;
      state.settings.counters[targetCounter[0]].order = currentOrder;
      
      // Save settings without triggering full word count update
      localStorage.setItem('settings', JSON.stringify(state.settings));
      updateCounterDisplay();
      updateCounterSettings();
    }
  }
}

function moveCounterDown(counterKey) {
  const maxOrder = Math.max(...Object.values(state.settings.counters).map(c => c.order));
  const currentOrder = state.settings.counters[counterKey].order;
  
  if (currentOrder < maxOrder) {
    // Find the counter that has order = currentOrder + 1
    const targetCounter = Object.entries(state.settings.counters)
      .find(([key, config]) => config.order === currentOrder + 1);
    
    if (targetCounter) {
      // Swap orders
      state.settings.counters[counterKey].order = currentOrder + 1;
      state.settings.counters[targetCounter[0]].order = currentOrder;
      
      // Save settings without triggering full word count update
      localStorage.setItem('settings', JSON.stringify(state.settings));
      updateCounterDisplay();
      updateCounterSettings();
    }
  }
}

function resetCountersToDefault() {
  // Reset counters to default: all enabled except speaking, reading, and handwriting
  state.settings.counters = {
    wordsNoCitations: { enabled: true, order: 0, shortName: 'Words without Citations', tooltip: 'Words without Citations' },
    wordsWithCitations: { enabled: true, order: 1, shortName: 'Total Words', tooltip: 'Total Words' },
    charsNoCitations: { enabled: true, order: 2, shortName: 'Characters without Citations', tooltip: 'Characters without Citations' },
    charsWithCitations: { enabled: true, order: 3, shortName: 'Total Characters', tooltip: 'Total Characters' },
    citations: { enabled: true, order: 4, shortName: 'Citations', tooltip: 'Citations' },
    speakingTime: { enabled: false, order: 5, shortName: 'Speaking Time', tooltip: 'Speaking Time' },
    readingTime: { enabled: false, order: 6, shortName: 'Reading Time', tooltip: 'Reading Time' },
    handwritingTime: { enabled: false, order: 7, shortName: 'Handwriting Time', tooltip: 'Handwriting Time' }
  };
  
  // Save settings
  localStorage.setItem('settings', JSON.stringify(state.settings));
  
  // Update display
  updateCounterDisplay();
  updateCounterSettings();
  
  // Show confirmation
  showNotification('Counters have been reset to default', false);
}

function updateCounterSettings() {
  const counterSettingsContainer = document.getElementById('counter-settings-container');
  if (!counterSettingsContainer) return;

  // Get all counters sorted by order
  const sortedCounters = Object.entries(state.settings.counters)
    .sort(([, a], [, b]) => a.order - b.order);

  counterSettingsContainer.innerHTML = '';

  sortedCounters.forEach(([key, config]) => {
    const counterDiv = document.createElement('div');
    counterDiv.className = 'flex items-center justify-between p-3 rounded-md';
    counterDiv.style.background = '#f3f4f6';

    const leftSection = document.createElement('div');
    leftSection.className = 'flex-1';

    const label = document.createElement('span');
    label.className = 'font-medium';
    label.textContent = config.shortName;

    const description = document.createElement('p');
    description.className = 'text-sm text-gray-500 dark:text-gray-400 mt-1';
    description.textContent = getCounterDescription(key);

    leftSection.appendChild(label);
    leftSection.appendChild(description);

    const rightSection = document.createElement('div');
    rightSection.className = 'flex items-center gap-2';

    // Toggle switch
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'relative inline-flex items-center cursor-pointer';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.className = 'sr-only peer';
    toggleInput.checked = config.enabled;
    toggleInput.addEventListener('change', function() {
      toggleCounter(key, this.checked);
      updateCounterSettings();
    });

    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600';

    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleDiv);

    // Reorder buttons
    const reorderDiv = document.createElement('div');
    reorderDiv.className = 'flex flex-col gap-1';

    const upButton = document.createElement('button');
    upButton.className = 'p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed';
    upButton.disabled = config.order === 0;
    upButton.innerHTML = '▲';
    upButton.addEventListener('click', () => moveCounterUp(key));

    const downButton = document.createElement('button');
    downButton.className = 'p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed';
    const maxOrder = Math.max(...Object.values(state.settings.counters).map(c => c.order));
    downButton.disabled = config.order === maxOrder;
    downButton.innerHTML = '▼';
    downButton.addEventListener('click', () => moveCounterDown(key));

    reorderDiv.appendChild(upButton);
    reorderDiv.appendChild(downButton);

    rightSection.appendChild(toggleLabel);
    rightSection.appendChild(reorderDiv);

    counterDiv.appendChild(leftSection);
    counterDiv.appendChild(rightSection);

    counterSettingsContainer.appendChild(counterDiv);
  });
}

function getCounterDescription(counterKey) {
  const descriptions = {
    wordsNoCitations: 'Word count excluding all citations and references',
    wordsWithCitations: 'Total word count including citations',
    charsNoCitations: 'Character count excluding all citations and references',
    charsWithCitations: 'Total character count including citations',
    citations: 'Number of unique citations detected',
    speakingTime: 'Estimated time to speak the text (150 words/min)',
    readingTime: 'Estimated time to read the text (200 words/min)',
    handwritingTime: 'Estimated time to write the text by hand (40 words/min)'
  };
  return descriptions[counterKey] || 'Counter description';
}

// Info dialogue functions
function showInfoDialogue(type) {
  const dialogue = document.getElementById('info-dialogue');
  const titleText = document.getElementById('info-dialogue-title-text');
  const content = document.getElementById('info-dialogue-content');
  const overlay = document.getElementById('overlay-background');
  
  if (type === 'speaking') {
    titleText.textContent = 'Speaking Time Calculation';
    content.textContent = 'This calculation is based on an average speaking rate of 150 words per minute. This represents the time needed to read the text aloud at a normal pace. Speaking rates can vary significantly between individuals and contexts, but 150 words per minute is widely accepted as the standard for comfortable speech delivery.';
  } else if (type === 'reading') {
    titleText.textContent = 'Reading Time Calculation';
    content.textContent = 'This calculation is based on an average reading speed of 200 words per minute. This represents typical silent reading speed for adults. Reading speeds vary based on factors like text complexity, familiarity with the subject, and individual reading ability, but 200 words per minute is considered the average for general comprehension reading.';
  } else if (type === 'handwriting') {
    titleText.textContent = 'Handwriting Time Calculation';
    content.textContent = 'This calculation is based on an average handwriting speed of 40 words per minute. This represents the time needed to write the text by hand at a normal pace. Handwriting speeds vary significantly between individuals, materials used (pen, pencil), and writing style (cursive vs. print), but 40 words per minute is widely accepted as the average for continuous handwritten text. This estimate assumes standard paper and pen, not digital handwriting devices.';
  } else if (type === 'wordsNoCitations') {
    titleText.textContent = 'Words without Citations';
    content.textContent = 'This count includes only the main body text, excluding all in-text citations, reference entries, and bibliography. This measurement is particularly useful for academic assignments where word limits typically apply to content only, not citations. CiteCount automatically detects and removes various citation formats including APA, MLA, Chicago, Harvard, and other academic styles.';
  } else if (type === 'wordsWithCitations') {
    titleText.textContent = 'Total Words';
    content.textContent = 'This is the complete word count including all text: your main content, in-text citations, references, bibliography, and any other textual elements in your document. This gives you the full scope of your document\'s length and is useful for understanding the total amount of text you\'ve written.';
  } else if (type === 'charsNoCitations') {
    titleText.textContent = 'Characters without Citations';
    content.textContent = 'This count includes all characters (letters, numbers, punctuation, and spaces) in your main content, excluding citations and references. Character counts are sometimes used for strict length requirements in applications, abstracts, or social media posts. This measurement ensures you\'re only counting your actual content, not the supporting citations.';
  } else if (type === 'charsWithCitations') {
    titleText.textContent = 'Total Characters';
    content.textContent = 'This is the complete character count including all text elements in your document: main content, citations, references, spaces, punctuation, and special characters. This comprehensive count gives you the absolute length of your document and can be useful for file size estimation or platform limitations that consider all characters.';
  } else if (type === 'citations') {
    titleText.textContent = 'Citations Count';
    content.textContent = 'CiteCount automatically detects and counts in-text citations and reference entries across multiple academic formats including APA, MLA, Chicago, Harvard, and others. This includes parenthetical citations like (Smith, 2023), author-date citations, numbered references, and footnote citations. The detection uses advanced pattern recognition to identify various citation styles and formats used in academic writing.';
  }
  
  dialogue.style.display = 'block';
  overlay.style.display = 'block';
}

function closeInfoDialogue() {
  const dialogue = document.getElementById('info-dialogue');
  const overlay = document.getElementById('overlay-background');
  
  dialogue.style.display = 'none';
  overlay.style.display = 'none';
}

function showExcludeCitationInfoModal() {
  const modal = document.getElementById('exclude-citation-modal');
  const overlay = document.getElementById('overlay-background');
  
  if (modal && overlay) {
    modal.style.display = 'block';
    overlay.style.display = 'block';
  }
}

function closeExcludeCitationInfoModal() {
  const modal = document.getElementById('exclude-citation-modal');
  const overlay = document.getElementById('overlay-background');
  
  if (modal && overlay) {
    modal.style.display = 'none';
    overlay.style.display = 'none';
  }
}

// Cookie Consent Management
class CookieConsent {
  constructor() {
    this.STORAGE_KEY = 'cookieConsent';
    this.banner = document.getElementById('cookie-consent-banner');
    this.settingsModal = document.getElementById('cookie-settings-modal');
    this.init();
  }

  init() {
    // Check if user has already made a choice
    const consent = this.getConsent();
    if (!consent) {
      this.showBanner();
    } else {
      this.applyConsent(consent);
    }

    this.bindEvents();
  }

  bindEvents() {
    // Banner buttons
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      this.acceptAll();
    });

    document.getElementById('cookie-reject')?.addEventListener('click', () => {
      this.rejectNonEssential();
    });

    document.getElementById('cookie-settings')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Settings modal buttons
    document.getElementById('close-cookie-settings')?.addEventListener('click', () => {
      this.hideSettings();
    });

    document.getElementById('save-cookie-preferences')?.addEventListener('click', () => {
      this.savePreferences();
    });

    document.getElementById('accept-all-settings')?.addEventListener('click', () => {
      this.acceptAllFromSettings();
    });

    // Close modal when clicking outside
    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hideSettings();
      }
    });
  }

  showBanner() {
    if (this.banner) {
      this.banner.style.display = 'block';
    }
  }

  hideBanner() {
    if (this.banner) {
      this.banner.style.display = 'none';
    }
  }

  showSettings() {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'flex';
      this.loadCurrentPreferences();
    }
  }

  hideSettings() {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'none';
    }
  }

  loadCurrentPreferences() {
    const consent = this.getConsent();
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const advertisingCheckbox = document.getElementById('advertising-cookies');

    if (consent) {
      if (analyticsCheckbox) analyticsCheckbox.checked = consent.analytics;
      if (advertisingCheckbox) advertisingCheckbox.checked = consent.advertising;
    } else {
      // Default to checked if no preference set
      if (analyticsCheckbox) analyticsCheckbox.checked = true;
      if (advertisingCheckbox) advertisingCheckbox.checked = true;
    }
  }

  acceptAll() {
    const consent = {
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: Date.now()
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  rejectNonEssential() {
    const consent = {
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: Date.now()
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  savePreferences() {
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const advertisingCheckbox = document.getElementById('advertising-cookies');

    const consent = {
      essential: true,
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      advertising: advertisingCheckbox ? advertisingCheckbox.checked : false,
      timestamp: Date.now()
    };

    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
    this.hideSettings();
  }

  acceptAllFromSettings() {
    document.getElementById('analytics-cookies').checked = true;
    document.getElementById('advertising-cookies').checked = true;
    this.savePreferences();
  }

  saveConsent(consent) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
  }

  getConsent() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  applyConsent(consent) {
    // Handle analytics
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Handle advertising
    if (consent.advertising) {
      this.enableAdvertising();
    } else {
      this.disableAdvertising();
    }
  }

  enableAnalytics() {
    // Enable Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }

    // Enable other analytics if needed
    console.log('Analytics enabled');
  }

  disableAnalytics() {
    // Disable Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    console.log('Analytics disabled');
  }

  enableAdvertising() {
    // Enable advertising cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    }

    console.log('Advertising enabled');
  }

  disableAdvertising() {
    // Disable advertising cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }

    console.log('Advertising disabled');
  }

  // Method to check if a specific consent type is granted
  hasConsent(type) {
    const consent = this.getConsent();
    return consent ? consent[type] : false;
  }

  // Method to revoke consent (for testing or user request)
  revokeConsent() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.showBanner();
  }
}

// Initialize cookie consent when DOM is loaded
// TEMPORARILY COMMENTED OUT
// document.addEventListener('DOMContentLoaded', function() {
//  window.cookieConsent = new CookieConsent();
// });

// Perplexity Overlay Logic
/*function showPerplexityOverlay() {
  const overlay = document.getElementById('perplexity-overlay');
  // Check if already dismissed
  if (overlay && !localStorage.getItem('perplexityOverlayDismissed')) {
    // Small delay to ensure smooth entrance
    setTimeout(() => {
      overlay.classList.add('show');
      
      // Countdown logic
      const dismissBtn = document.getElementById('perplexity-dismiss-btn');
      if (dismissBtn) {
        let timeLeft = 5;
        dismissBtn.textContent = `Maybe Later (${timeLeft})`;
        dismissBtn.style.opacity = '0.5';
        dismissBtn.style.pointerEvents = 'none';
        
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft > 0) {
            dismissBtn.textContent = `Maybe Later (${timeLeft})`;
          } else {
            clearInterval(timer);
            dismissBtn.textContent = 'Maybe Later';
            dismissBtn.style.opacity = '1';
            dismissBtn.style.pointerEvents = 'auto';
          }
        }, 1000);
      }
    }, 1000);
  }
}*/

function dismissPerplexityOverlay() {
  const overlay = document.getElementById('perplexity-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    localStorage.setItem('perplexityOverlayDismissed', 'true');
  }
}

function dismissSidebarAd() {
  const adBox = document.getElementById('sidebar-ad-box');
  if (adBox) {
    adBox.style.display = 'none';
    // Only dismiss for current session, will show again on page reload
  }
}

function claimPerplexityOffer() {
  window.open('https://pplx.ai/cite', '_blank');
  dismissPerplexityOverlay();
}

document.addEventListener('DOMContentLoaded', () => {
      const changingText = document.getElementById('cc-changing-text');
      if (!changingText) {
        return;
      }

      const fallback = document.querySelector('.cc-hero-fallback');
      if (fallback) {
        fallback.style.display = 'none';
      }

      const texts = [
        'Research Papers',
        'IB Courseworks',
        'Academic Essays',
        'Dissertations',
        'University Assignments'
      ];
      const lightGradients = [
        'linear-gradient(90deg, #ef4444, #f97316)',
        'linear-gradient(90deg, #ec4899, #a855f7)',
        'linear-gradient(90deg, #2563eb, #38bdf8)',
        'linear-gradient(90deg, #f59e0b, #f97316)',
        'linear-gradient(90deg, #22c55e, #14b8a6)',
        'linear-gradient(90deg, #db2777, #7c3aed)'
      ];
      const darkGradients = [
        'linear-gradient(90deg, #fda4af, #fed7aa)',
        'linear-gradient(90deg, #fbcfe8, #f0abfc)',
        'linear-gradient(90deg, #93c5fd, #67e8f9)',
        'linear-gradient(90deg, #fde047, #fdba74)',
        'linear-gradient(90deg, #86efac, #5eead4)',
        'linear-gradient(90deg, #f9a8d4, #c4b5fd)'
      ];
      let index = 0;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const getGradients = () => (mediaQuery.matches ? darkGradients : lightGradients);

      changingText.style.backgroundImage = getGradients()[index];

      setInterval(() => {
        index = (index + 1) % texts.length;
        changingText.textContent = texts[index];
        changingText.style.backgroundImage = getGradients()[index];
        changingText.classList.remove('animate');
        void changingText.offsetWidth;
        changingText.classList.add('animate');
      }, 3000);

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', () => {
          changingText.style.backgroundImage = getGradients()[index];
        });
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(() => {
          changingText.style.backgroundImage = getGradients()[index];
        });
      }
    });

// More Tools Functions
function showMoreToolsIframe(toolName, iframeViewId) {
  const toolsGridView = document.getElementById('dictionary-tools-view');
  const iframeView = document.getElementById(iframeViewId);
  const dictionaryIframeView = document.getElementById('dictionary-iframe-view');
  const thesaurusIframeView = document.getElementById('thesaurus-iframe-view');
  const pomodoroIframeView = document.getElementById('pomodoro-iframe-view');
  const translateIframeView = document.getElementById('translate-iframe-view');
  const notepadIframeView = document.getElementById('notepad-iframe-view');
  const moreAppsContainer = document.getElementById('more-apps-container');
  const panelTitle = document.getElementById('panel-title');
  const moreToolsHeaderNav = document.getElementById('more-tools-header-nav');

  if (toolsGridView) toolsGridView.style.display = 'none';
  if (dictionaryIframeView) dictionaryIframeView.style.display = 'none';
  if (thesaurusIframeView) thesaurusIframeView.style.display = 'none';
  if (pomodoroIframeView) pomodoroIframeView.style.display = 'none';
  if (translateIframeView) translateIframeView.style.display = 'none';
  if (notepadIframeView) notepadIframeView.style.display = 'none';
  if (iframeView) iframeView.style.display = 'flex';

  // Remove padding when showing iframe for full-space usage
  if (moreAppsContainer) moreAppsContainer.style.padding = '0';

  // Track the currently active iframe for navigation
  const iframeIdMap = {
    'dictionary-iframe-view': 'dictionary-iframe',
    'thesaurus-iframe-view': 'thesaurus-iframe',
    'pomodoro-iframe-view': 'pomodoro-iframe',
    'translate-iframe-view': 'translate-iframe',
    'notepad-iframe-view': 'notepad-iframe',
    'wordbank-container': 'wordbank-iframe',
    'scientific-calculator-container': 'scientific-calculator-iframe',
    'graphing-calculator-container': 'graphing-calculator-iframe'
  };
  currentActiveIframe = iframeIdMap[iframeViewId] || null;

  if (panelTitle) {
    panelTitle.innerHTML = `<span style="opacity: 0.5; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.opacity='0.8'; this.style.textDecoration='underline'" onmouseout="this.style.opacity='0.5'; this.style.textDecoration='none'" onclick="closeMoreToolsView()">More Tools</span> / ${toolName}`;
  }
  if (moreToolsHeaderNav) moreToolsHeaderNav.style.display = 'flex';
}

function openDictionaryTool() {
  showMoreToolsIframe('Dictionary', 'dictionary-iframe-view');
}

function openThesaurusTool() {
  showMoreToolsIframe('Thesaurus', 'thesaurus-iframe-view');
}

function openPomodoroTool() {
  showMoreToolsIframe('Pomodoro Timer', 'pomodoro-iframe-view');
}

function openTranslateTool() {
  showMoreToolsIframe('Translate', 'translate-iframe-view');
}

function openNotepadTool() {
  showMoreToolsIframe('Notepad', 'notepad-iframe-view');
}

function closeMoreToolsView() {
  const toolsGridView = document.getElementById('dictionary-tools-view');
  const dictionaryIframeView = document.getElementById('dictionary-iframe-view');
  const thesaurusIframeView = document.getElementById('thesaurus-iframe-view');
  const pomodoroIframeView = document.getElementById('pomodoro-iframe-view');
  const translateIframeView = document.getElementById('translate-iframe-view');
  const notepadIframeView = document.getElementById('notepad-iframe-view');
  const moreAppsContainer = document.getElementById('more-apps-container');
  const panelTitle = document.getElementById('panel-title');
  const moreToolsHeaderNav = document.getElementById('more-tools-header-nav');

  if (toolsGridView) toolsGridView.style.display = 'flex';
  if (dictionaryIframeView) dictionaryIframeView.style.display = 'none';
  if (thesaurusIframeView) thesaurusIframeView.style.display = 'none';
  if (pomodoroIframeView) pomodoroIframeView.style.display = 'none';
  if (translateIframeView) translateIframeView.style.display = 'none';
  if (notepadIframeView) notepadIframeView.style.display = 'none';

  // Restore padding when showing tools grid
  if (moreAppsContainer) moreAppsContainer.style.padding = '1rem';

  // Reset the active iframe tracker
  currentActiveIframe = null;
  
  // Navigate back to More Tools page
  switchPanelTab('moreApps', true, false);

  if (panelTitle) panelTitle.textContent = 'More Tools';
  if (moreToolsHeaderNav) moreToolsHeaderNav.style.display = 'none';
}

// Variable to track the currently active iframe
let currentActiveIframe = null;

// Navigation history for More Tools section
let moreToolsNavigationHistory = ['moreApps']; // Start with More Tools page
let moreToolsNavigationIndex = 0; // Current position in history

// Function to get the currently visible iframe
function getCurrentIframe() {
  if (currentActiveIframe) {
    return document.getElementById(currentActiveIframe);
  }
  
  // Fallback: Find the currently visible iframe
  const iframeIds = [
    'dictionary-iframe',
    'thesaurus-iframe',
    'pomodoro-iframe',
    'translate-iframe',
    'notepad-iframe',
    'wordbank-iframe',
    'scientific-calculator-iframe',
    'graphing-calculator-iframe'
  ];
  
  for (const id of iframeIds) {
    const container = document.getElementById(id.replace('-iframe', '-container'));
    if (container && container.style.display !== 'none') {
      currentActiveIframe = id;
      return document.getElementById(id);
    }
  }
  
  return null;
}

// Add entry to navigation history
function addToMoreToolsHistory(toolName) {
  // Remove any forward history when navigating to a new page
  moreToolsNavigationHistory = moreToolsNavigationHistory.slice(0, moreToolsNavigationIndex + 1);
  
  // Don't add duplicate consecutive entries
  if (moreToolsNavigationHistory[moreToolsNavigationIndex] !== toolName) {
    moreToolsNavigationHistory.push(toolName);
    moreToolsNavigationIndex++;
  }
  
  updateNavigationButtons();
}

// Update navigation button states
function updateNavigationButtons() {
  const backBtn = document.getElementById('iframe-back-btn');
  const forwardBtn = document.getElementById('iframe-forward-btn');
  
  if (backBtn) {
    // Enable back button if we're not at the start of history
    if (moreToolsNavigationIndex > 0) {
      backBtn.style.opacity = '1';
      backBtn.style.cursor = 'pointer';
      backBtn.disabled = false;
    } else {
      backBtn.style.opacity = '0.4';
      backBtn.style.cursor = 'not-allowed';
      backBtn.disabled = true;
    }
  }
  
  if (forwardBtn) {
    // Enable forward button if we're not at the end of history
    if (moreToolsNavigationIndex < moreToolsNavigationHistory.length - 1) {
      forwardBtn.style.opacity = '1';
      forwardBtn.style.cursor = 'pointer';
      forwardBtn.disabled = false;
    } else {
      forwardBtn.style.opacity = '0.4';
      forwardBtn.style.cursor = 'not-allowed';
      forwardBtn.disabled = true;
    }
  }
}

// Navigate back in More Tools history
function navigateIframeBack() {
  if (moreToolsNavigationIndex > 0) {
    moreToolsNavigationIndex--;
    const previousTool = moreToolsNavigationHistory[moreToolsNavigationIndex];
    switchPanelTab(previousTool, true, true); // true for isMoreToolView, true for isHistoryNavigation
    updateNavigationButtons();
  }
}

// Navigate forward in More Tools history
function navigateIframeForward() {
  if (moreToolsNavigationIndex < moreToolsNavigationHistory.length - 1) {
    moreToolsNavigationIndex++;
    const nextTool = moreToolsNavigationHistory[moreToolsNavigationIndex];
    switchPanelTab(nextTool, true, true); // true for isMoreToolView, true for isHistoryNavigation
    updateNavigationButtons();
  }
}

// Reload current view (iframe or page)
function reloadIframe() {
  const iframe = getCurrentIframe();
  if (iframe) {
    try {
      iframe.contentWindow.location.reload();
    } catch (e) {
      // If direct reload fails (cross-origin), reload via src
      const currentSrc = iframe.src;
      iframe.src = currentSrc;
    }
  } else {
    // If not an iframe, just re-render the current view
    const currentTool = moreToolsNavigationHistory[moreToolsNavigationIndex];
    if (currentTool) {
      switchPanelTab(currentTool, true, true);
    }
  }
}

// ========================================
// Context Menu and Pinned Tool Management
// ========================================

// Available tools with their display names and IDs
const availableTools = [
  { id: 'generateCitation', name: '📝 Generate Citation', icon: '📝' },
  { id: 'details', name: '📊 Word Count Details', icon: '📊' },
  { id: 'dictionary', name: '📚 Dictionary', icon: '📚' },
  { id: 'thesaurus', name: '🧠 Thesaurus', icon: '🧠' },
  { id: 'pomodoro', name: '🍅 Pomodoro Timer', icon: '🍅' },
  { id: 'translate', name: '🌐 Translate', icon: '🌐' },
  { id: 'notepad', name: '📝 Notepad', icon: '📝' },
  { id: 'wordbank', name: '💬 Word Bank', icon: '💬' },
  { id: 'scientificCalculator', name: '🧮 Scientific Calculator', icon: '🧮' },
  { id: 'graphingCalculator', name: '📈 Graphing Calculator', icon: '📈' }
];

// Initialize context menu for tab buttons
function initializeTabContextMenu() {
  const generateCitationTab = document.getElementById('generate-citation-tab');
  const detailsTab = document.getElementById('details-tab');
  const contextMenu = document.getElementById('tab-context-menu');

  // Add right-click handlers to only the second and third tab buttons (not citations)
  const tabs = [generateCitationTab, detailsTab];
  
  tabs.forEach((tab, index) => {
    if (!tab) return;
    
    tab.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Store which tab was right-clicked
      contextMenuTargetTabId = tab.id;
      contextMenuTargetTabIndex = index;
      
      // Get context menu dimensions
      contextMenu.style.display = 'block';
      contextMenu.style.visibility = 'hidden';
      const menuHeight = contextMenu.offsetHeight;
      contextMenu.style.visibility = 'visible';
      
      // Position context menu above cursor to avoid being hidden below app
      contextMenu.style.left = e.pageX + 'px';
      contextMenu.style.top = (e.pageY - menuHeight - 5) + 'px';
    });
  });

  // Close context menu when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });
}

// Open the edit pinned tool modal
function openEditPinnedToolModal() {
  const modal = document.getElementById('edit-pinned-tool-modal');
  const contextMenu = document.getElementById('tab-context-menu');
  const modalTabName = document.getElementById('modal-tab-name');
  const toolSelectionGrid = document.getElementById('tool-selection-grid');
  
  // Hide context menu
  if (contextMenu) contextMenu.style.display = 'none';
  
  // Get current pinned tools
  const pinnedTools = JSON.parse(localStorage.getItem('pinnedTools') || '["generateCitation", "details"]');
  
  // Determine which tab index we're editing
  let editingIndex = -1;
  let tabDisplayName = '';
  
  if (contextMenuTargetTabId === 'generate-citation-tab') {
    // Tab 2 - pinnedTools[0]
    editingIndex = 0;
    tabDisplayName = 'Tab 2';
  } else if (contextMenuTargetTabId === 'details-tab') {
    // Tab 3 - pinnedTools[1]
    editingIndex = 1;
    tabDisplayName = 'Tab 3';
  }
  
  if (editingIndex === -1) return;
  
  // Set modal title
  modalTabName.textContent = tabDisplayName;
  
  // Clear and populate tool selection grid
  toolSelectionGrid.innerHTML = '';
  
  availableTools.forEach(tool => {
    const isCurrentlyPinned = pinnedTools[editingIndex] === tool.id;
    const isPinnedElsewhere = pinnedTools.includes(tool.id) && !isCurrentlyPinned;
    
    const toolOption = document.createElement('div');
    toolOption.style.cssText = `
      padding: 1rem;
      border: 2px solid ${isCurrentlyPinned ? 'var(--accent-color)' : 'var(--border-primary)'};
      border-radius: 0.5rem;
      cursor: ${isPinnedElsewhere ? 'not-allowed' : 'pointer'};
      transition: all 0.2s;
      background: ${isCurrentlyPinned ? 'rgba(0, 78, 146, 0.1)' : (isPinnedElsewhere ? 'var(--background-secondary)' : 'var(--background-primary)')};
      opacity: ${isPinnedElsewhere ? '0.5' : '1'};
      position: relative;
    `;
    
    if (!isPinnedElsewhere) {
      toolOption.onmouseover = function() {
        if (!isCurrentlyPinned) {
          this.style.borderColor = 'var(--accent-color)';
          this.style.background = 'rgba(0, 78, 146, 0.05)';
        }
      };
      toolOption.onmouseout = function() {
        if (!isCurrentlyPinned) {
          this.style.borderColor = 'var(--border-primary)';
          this.style.background = 'var(--background-primary)';
        }
      };
    }
    
    toolOption.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">${tool.icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${tool.name.replace(tool.icon + ' ', '')}</div>
          ${isCurrentlyPinned ? '<div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 500;">Currently Pinned</div>' : ''}
          ${isPinnedElsewhere ? '<div style="font-size: 0.75rem; color: #EF4444; font-weight: 500;">Pinned to Another Tab</div>' : ''}
        </div>
        ${isCurrentlyPinned ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' : ''}
      </div>
    `;
    
    toolOption.onclick = function() {
      if (isPinnedElsewhere) {
        // Show duplicate warning using notify()
        notify('This tool is already pinned to another tab. Please choose a different tool.');
      } else {
        // Update pinned tool
        selectPinnedTool(editingIndex, tool.id);
      }
    };
    
    toolSelectionGrid.appendChild(toolOption);
  });
  
  // Show modal
  modal.style.display = 'flex';
  
  // Add ESC key handler to close modal
  const escHandler = function(e) {
    if (e.key === 'Escape') {
      closeEditPinnedToolModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Select a tool for a pinned slot
function selectPinnedTool(slotIndex, toolId) {
  const pinnedTools = JSON.parse(localStorage.getItem('pinnedTools') || '["generateCitation", "details"]');
  
  // Check if tool is already pinned elsewhere
  const existingIndex = pinnedTools.indexOf(toolId);
  if (existingIndex !== -1 && existingIndex !== slotIndex) {
    notify('This tool is already pinned to another tab. Please choose a different tool.');
    return;
  }
  
  // Update pinned tools
  pinnedTools[slotIndex] = toolId;
  localStorage.setItem('pinnedTools', JSON.stringify(pinnedTools));
  
  // Update UI
  updatePinnedTabLabels();
  
  // Switch to the newly pinned tool
  switchPanelTab(toolId, false);
  
  // Close modal
  closeEditPinnedToolModal();
  
  notify('Tool pinned successfully!');
}

// Close the edit pinned tool modal
function closeEditPinnedToolModal() {
  const modal = document.getElementById('edit-pinned-tool-modal');
  if (modal) modal.style.display = 'none';
}

// Update tab labels based on pinned tools
function updatePinnedTabLabels() {
  const pinnedTools = JSON.parse(localStorage.getItem('pinnedTools') || '["generateCitation", "details"]');
  const generateCitationTab = document.getElementById('generate-citation-tab');
  const detailsTab = document.getElementById('details-tab');
  
  // Update tab 2 label
  if (generateCitationTab) {
    const tool1 = availableTools.find(t => t.id === pinnedTools[0]);
    if (tool1) {
      const label = generateCitationTab.querySelector('.tab-label');
      if (label) {
        label.textContent = tool1.name.replace(tool1.icon + ' ', '');
      }
    }
  }
  
  // Update tab 3 label
  if (detailsTab) {
    const tool2 = availableTools.find(t => t.id === pinnedTools[1]);
    if (tool2) {
      const label = detailsTab.querySelector('.tab-label');
      if (label) {
        label.textContent = tool2.name.replace(tool2.icon + ' ', '');
      }
    }
  }
}