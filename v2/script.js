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
    wordsNoCitations: true,
    charsNoCitations: true,
    wordsWithCitations: true,
    charsWithCitations: true,
    citations: true,
    fontSize: 16,
    fontFamily: 'system-ui',
    // Counter display settings
    counters: {
      wordsNoCitations: { enabled: true, order: 0, shortName: 'Words without Citations', tooltip: 'Words without Citations' },
      wordsWithCitations: { enabled: true, order: 1, shortName: 'Total Words', tooltip: 'Total Words' },
      charsNoCitations: { enabled: true, order: 2, shortName: 'Characters without Citations', tooltip: 'Characters without Citations' },
      charsWithCitations: { enabled: true, order: 3, shortName: 'Total Characters', tooltip: 'Total Characters' },
      citations: { enabled: true, order: 4, shortName: 'Citations', tooltip: 'Citations' },
      speakingTime: { enabled: false, order: 5, shortName: 'Speaking Time', tooltip: 'Speaking Time' },
      readingTime: { enabled: false, order: 6, shortName: 'Reading Time', tooltip: 'Reading Time' }
    }
  },
  currentOccurrenceIndex: new Map(),
  sortState: {
    field: 'none', // 'none', 'citation'
    direction: 'asc' // 'asc', 'desc'
  }
};

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
    updateSettingsUI();
  } else {
    // Initialize settings UI even when no saved settings exist
    updateSettingsUI();
  }

  const savedCitationStates = localStorage.getItem('citationStates');
  if (savedCitationStates) {
    state.includedCitations = new Map(JSON.parse(savedCitationStates));
  }

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
    const dropdown = document.getElementById('other-apps-dropdown');
    const button = document.getElementById('other-apps-btn');
    
    // If clicking outside both the dropdown and the button, close the dropdown
    if (!dropdown.contains(e.target) && !button.contains(e.target)) {
      dropdown.classList.add('hidden');
    }

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

  // Prevent dropdown from closing when clicking inside it
  document.getElementById('other-apps-dropdown').addEventListener('click', (e) => {
    e.stopPropagation();
  });
});

function closeOverlays() {
  toggleCitationsOverlay(false);
  toggleSettingsOverlay(false);
  toggleHelpOverlay(false);
  document.getElementById('confirmation-overlay').style.display = 'none';
  document.getElementById('info-dialogue').style.display = 'none';
  document.getElementById('overlay-background').style.display = 'none';
  document.getElementById('other-apps-dropdown').classList.add('hidden');
  const formatDropdown = document.getElementById('format-dropdown');
  if (formatDropdown) {
    formatDropdown.classList.add('hidden');
  }
  const fontFamilyDropdown = document.getElementById('fontFamilyDropdown');
  if (fontFamilyDropdown) {
    fontFamilyDropdown.classList.add('hidden');
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('other-apps-dropdown');
  dropdown.classList.toggle('hidden');
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
  debounce(updateWordCount, 300)();
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
  if (setting === 'warnLeave') {
    window.onbeforeunload = value ? (e => {
      if (!state.settings.autoSave && document.getElementById('editor').innerText.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    }) : null;
  }
}

function updateFontSize(size) {
  state.settings.fontSize = parseInt(size);
  saveSettings();
  updateSettingsUI();
}

function updateFontFamily(family) {
  state.settings.fontFamily = family;
  saveSettings();
  updateSettingsUI();
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
  
  // Update counter settings display
  updateCounterSettings();
  
  window.onbeforeunload = state.settings.warnLeave && !state.settings.autoSave && document.getElementById('editor').innerText.trim() ? (e => {
    e.preventDefault();
    e.returnValue = '';
  }) : null;
}

function resetSettings() {
  state.settings = {
    autoSave: true,
    warnLeave: true,
    spellCheck: true,
    focus: false,
    wordsNoCitations: true,
    charsNoCitations: true,
    wordsWithCitations: true,
    charsWithCitations: true,
    citations: true,
    fontSize: 16,
    fontFamily: 'system-ui'
  };
  saveSettings();
  showNotification('Settings have been reset. Please reload the page for changes to take effect.');
  localStorage.removeItem('rawData');
  localStorage.removeItem('citationStates');
}

let citationCounter = 0;
function highlightCitations(content) {
  citationCounter = 0;
  return content.replace(/[()（）][^()（）]*[()（）]/g, (match) => {
    citationCounter++;
    const citationText = match.slice(1, -1);
    const isIncluded = state.includedCitations.get(citationText) || false;
    return `<span id="citation-${citationCounter}" class="citation-highlight ${isIncluded ? 'included' : 'excluded'}">${match}</span>`;
  });
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
    document.documentElement.style.cursor = 'col-resize';
    e.preventDefault();
  }

  function handleResize(e) {
    if (!isResizing) return;
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
    }
  }

  function stopResize() {
    isResizing = false;
    document.documentElement.style.cursor = '';
  }

  updatePanelFlex();
  window.addEventListener('resize', updatePanelFlex);

  gutter.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);

  gutter.addEventListener('touchstart', startResize);
  document.addEventListener('touchmove', handleResize);
  document.addEventListener('touchend', stopResize);
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
  const editorContainer = document.querySelector('.editor-container');
  const editor = document.getElementById('editor');

  editorContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    editorContainer.classList.add('dragover');
  });

  editorContainer.addEventListener('dragleave', () => {
    editorContainer.classList.remove('dragover');
  });

  editorContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    editorContainer.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileDrop(files[0]);
    }
  });
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
  if (file.type === 'application/pdf') {
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
          editor.innerText = text;
          welcomeText.style.display = 'none';
          handleEditorInput();
      };
      reader.readAsArrayBuffer(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const reader = new FileReader();
      reader.onload = function (e) {
          mammoth.extractRawText({ arrayBuffer: e.target.result })
              .then(result => {
                  editor.innerText = result.value;
                  welcomeText.style.display = 'none';
                  handleEditorInput();
              })
              .catch(err => {
                  showNotification('Error reading DOCX file: ' + err.message);
              });
      };
      reader.readAsArrayBuffer(file);
  } else {
      showNotification('Unsupported file type. Please use .docx or .pdf files.');
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
      handleFileDrop(file);
  }
}

function pasteFromClipboard() {
  navigator.clipboard.readText().then(text => {
    const editor = document.getElementById('editor');
    const welcomeText = document.getElementById('welcome-text');
    editor.innerText = text;
    welcomeText.style.display = 'none';
    handleEditorInput();
  }).catch(err => {
    notify('Please grant permission for CiteCount to access your clipboard.');
  });
}

function toggleCitationsOverlay(show) {
  const overlay = document.getElementById('citations-overlay');
  const background = document.getElementById('overlay-background');
  overlay.style.display = show ? 'flex' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function toggleSettingsOverlay(show) {
  const overlay = document.getElementById('settings-overlay');
  const background = document.getElementById('overlay-background');
  overlay.style.display = show ? 'flex' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function toggleHelpOverlay(show) {
  const overlay = document.getElementById('help-overlay');
  const background = document.getElementById('overlay-background');
  overlay.style.display = show ? 'flex' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function formatText(command) {
  document.execCommand(command, false, null);
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
    quoteCountEl.textContent = state.settings.citations ? state.citationGroups.size : '0';
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
      if (!state.includedCitations.has(citation)) {
        state.includedCitations.set(citation, false);
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
  checkbox.checked = state.includedCitations.get(citationText);
  checkbox.addEventListener('change', function () {
    state.includedCitations.set(citationText, this.checked);
    updateFilteredWordCount();
    saveCitationStates();
    // Update highlight colors immediately
    const editor = document.getElementById('editor');
    const highlightLayer = document.getElementById('highlight-layer');
    highlightLayer.innerHTML = highlightCitations(editor.innerHTML);
    syncScroll();
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
  document.getElementById('filtered-word-count').textContent = state.settings.wordsNoCitations ? (state.totalWords - state.citationWords) : '0';
  document.getElementById('filtered-char-count').textContent = state.settings.charsNoCitations ? (state.totalChars - state.citationChars) : '0';  // Added
}

function showNotification(message, confirm = false, onConfirm = null, type = 'notification') {
  const notification = document.getElementById('notification');
  const confirmation = document.getElementById('confirmation-overlay');
  const target = confirm ? confirmation : notification;

  target.innerHTML = '';
  if (confirm) {
    const h2 = document.createElement('h2');
    h2.textContent = 'Confirm Clear';
    const p = document.createElement('p');
    p.textContent = message;
    const div = document.createElement('div');
    div.className = 'mt-2 flex justify-center';
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes, Clear';
    yesButton.className = 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600';
    yesButton.addEventListener('click', () => {
      target.style.display = 'none';
      document.getElementById('overlay-background').style.display = 'none';
      if (onConfirm) onConfirm();
    });
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 ml-2';
    cancelButton.addEventListener('click', () => {
      target.style.display = 'none';
      document.getElementById('overlay-background').style.display = 'none';
    });
    div.appendChild(yesButton);
    div.appendChild(cancelButton);
    target.appendChild(h2);
    target.appendChild(p);
    target.appendChild(div);
    target.style.display = 'block';
    document.getElementById('overlay-background').style.display = 'block';
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
  state.includedCitations.set("since CiteCount detects citations in parenthesis, like this one", true);
  saveCitationStates();
  handleEditorInput();
}

document.addEventListener('DOMContentLoaded', function () {
  updateLayout();
  console.log('%cWARNING', 'font-size:8em;color:red;font-weight:900;')
  console.log(`%cThis is a browser feature intended for developers.
Do NOT copy and paste something here if you do not understand it.

You can learn more at:
https://en.wikipedia.org/wiki/Self-XSS`,
    'font-size:1.5em')
  const params = new URLSearchParams(window.location.search);
  const devMode = decodeURIComponent(params.get('dev'));
  if (devMode === 'true') {
    document.getElementById('devToolsWindow').style.display = 'flex';
  }
  const currentDomain = window.location.host;
  const isDomainAllowed =
    allowedDomains.includes(currentDomain) ||
    currentDomain.endsWith('--citecount.netlify.app') ||
    currentDomain.endsWith('--citecount-priv.netlify.app');

  if (!isDomainAllowed) {
    const warningDiv = document.createElement('div');
    warningDiv.style.position = 'fixed';
    warningDiv.style.top = '0';
    warningDiv.style.left = '0';
    warningDiv.style.width = '100%';
    warningDiv.style.height = '100%';
    warningDiv.style.fontSize = '30px';
    warningDiv.style.fontWeight = '700';
    warningDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    warningDiv.style.color = 'white';
    warningDiv.style.display = 'flex';
    warningDiv.style.flexDirection = 'column';
    warningDiv.style.alignItems = 'center';
    warningDiv.style.justifyContent = 'center';
    warningDiv.style.zIndex = '1000';
    warningDiv.style.textAlign = 'center';
    warningDiv.style.padding = '30px';
    const contentDiv = document.createElement('div');
    contentDiv.style.textAlign = 'center';
    warningDiv.appendChild(contentDiv);
    contentDiv.innerHTML = 'Heads Up!<h2>Accessing CiteCount from third-party hosts compromises your data\'s safety.</h2>Please visit the official CiteCount application at <a href="https://citecount.com" style="text-decoration: underline;">citecount.com</a>.<br><br>If you are aware of what you are doing, you can proceed by clicking the close button on the top left.';
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '30px';
    closeButton.style.right = '30px';
    closeButton.style.fontSize = '24px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '5px 20px';
    closeButton.onclick = function () {
      document.body.removeChild(warningDiv);
    };
    warningDiv.appendChild(closeButton);
    document.body.appendChild(warningDiv);
  }
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
  enabled: true, // Set to false to disable all announcements
  current: {
    id: 'perplexity-pro-offer-2025-v3', // Unique ID for this announcement
    message: '🎉 Exclusive Perplexity offer: 12 months of Perplexity Pro free for all students in ',
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
  const errorMessage = `An error occured, please contact the developers.\n` + `Error: ${message}\n` +
    `Source: ${source}\n` +
    `Line: ${lineno}\n` +
    `Column: ${colno}\n` +
    `Stack: ${error ? error.stack : 'N/A'}`;
  notify(errorMessage)
  if (source === 'https://liteanalytics.com/lite.js') {
    return true;
  }
};

// Flag to enable/disable donation messages
const DONATION_MESSAGES_ENABLED = true;

// Flag to enable/disable "No thanks" button opening the donation link
const NO_THANKS_OPENS_LINK = false;

const donationMessages = [
  // New Perplexity Pro promotional messages
  {
    text: `Students in ${userCountry} get 12 months of Perplexity Pro for FREE! Limited time offer.`,
    url: "https://pplx.ai/cite",
    buttonText: "Claim Free Pro"
  },
  {
    text: `Unlock AI-powered research with Perplexity Pro - FREE for 1 year for ${userCountry} students!`,
    url: "https://pplx.ai/cite",
    buttonText: "Get Free Access"
  },
  {
    text: `Free Perplexity Pro subscription (worth $240) for students in ${userCountry} - grab yours now!`,
    url: "https://pplx.ai/cite",
    buttonText: "Claim Offer"
  }
  
  // Old donation messages (commented out)
  /*{
    text: "Saved you time? A donation helps us keep saving yours.",
    url: "https://buymeacoffee.com/cite",
    buttonText: "Donate"
  },
  {
    text: "Keep CiteCount ad free — support us!",
    url: "https://buymeacoffee.com/cite",
    buttonText: "Support"
  },
  {
    text: "Join our Discord to participate a paid feedback session!",
    url: "https://discord.gg/twnz2957sK",
    buttonText: "Join"
  },
  {
    text: "Any feedback or suggestions? Drop a message!",
    url: "/contact?source=",
    buttonText: "Contact"
  },
  {
    text: "Fill a 1-minute survey for a chance to win $50!",
    url: "https://forms.gle/75BvyudP82DxZkfAA",
    buttonText: "Go to Survey"
  }*/
];

let hasInteracted = false;
let alertTimeout;
let currentDonationUrl = '';
let currentButtonText = '';

function hasUserDismissedAlert() {
  const lastDismissed = localStorage.getItem('donationAlertDismissedTimestamp');
  if (!lastDismissed) return false;
  const hoursSinceDismissal = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
  return hoursSinceDismissal < 24;
}

function markAlertAsDismissed() {
  localStorage.setItem('donationAlertDismissedTimestamp', Date.now());
}

function showDonationAlert() {
  if (!DONATION_MESSAGES_ENABLED || hasUserDismissedAlert()) return;
  const alert = document.getElementById('donation-alert');
  const messageElement = document.getElementById('donation-message');
  const donateButton = document.getElementById('donate-btn');
  
  // Create dynamic messages with current country
  const dynamicMessages = [
    {
      text: `Students in ${userCountry} get 12 months of Perplexity Pro for FREE! Limited time offer.`,
      url: "https://pplx.ai/cite",
      buttonText: "Claim Free Pro"
    },
    {
      text: `Unlock AI-powered research with Perplexity Pro - FREE for 1 year for ${userCountry} students!`,
      url: "https://pplx.ai/cite",
      buttonText: "Get Free Access"
    },
    {
      text: `Free Perplexity Pro subscription (worth $240) for students in ${userCountry} - grab yours now!`,
      url: "https://pplx.ai/cite",
      buttonText: "Claim Offer"
    }
  ];
  
  const randomIndex = Math.floor(Math.random() * dynamicMessages.length);
  const randomMessage = dynamicMessages[randomIndex];
  
  messageElement.textContent = randomMessage.text;
  currentDonationUrl = randomMessage.url;
  currentButtonText = randomMessage.buttonText;
  donateButton.textContent = currentButtonText;
  
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
  // Navigate to the same link as the donation button only if the flag is enabled
  if (NO_THANKS_OPENS_LINK) {
    window.open(currentDonationUrl, '_blank');
  }
}

function handleDonate() {
  window.open(currentDonationUrl, '_blank');
  hideDonationAlert();
  localStorage.removeItem('donationAlertDismissedTimestamp');
}

const isPremium = localStorage.getItem('isPremium');
document.getElementById('editor').addEventListener('click', function () {
  if (!hasInteracted && !hasUserDismissedAlert()) {
    if (isPremium == "true" || !DONATION_MESSAGES_ENABLED) return;
    hasInteracted = true;
    alertTimeout = setTimeout(showDonationAlert, 8000);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  hideDonationAlert();
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

// Tab switching functionality
function switchPanelTab(tabName) {
  const citationsTab = document.getElementById('citations-tab');
  const detailsTab = document.getElementById('details-tab');
  const citationsContainer = document.getElementById('citations-table-container');
  const detailsContainer = document.getElementById('word-count-details-container');
  const panelHeader = document.getElementById('panel-header');
  const searchRow = document.getElementById('citations-search-row');

  if (tabName === 'citations') {
    // Show citations tab
    citationsTab.classList.add('active');
    detailsTab.classList.remove('active');
    citationsTab.style.color = 'var(--text-primary)';
    citationsTab.style.borderBottomColor = 'var(--accent-color)';
    detailsTab.style.color = 'var(--text-secondary)';
    detailsTab.style.borderBottomColor = 'transparent';
    
    // Handle underline visibility
    const citationsUnderline = citationsTab.querySelector('.tab-underline');
    const detailsUnderline = detailsTab.querySelector('.tab-underline');
    if (citationsUnderline) citationsUnderline.style.opacity = '1';
    if (detailsUnderline) detailsUnderline.style.opacity = '0';
    
    citationsContainer.style.display = 'block';
    detailsContainer.style.display = 'none';
    
    // Hide header for citations
    if (panelHeader) {
      panelHeader.style.display = 'none';
    }
    
    // Show search row only if there are citations
    if (searchRow && state.citationGroups.size > 0) {
      searchRow.style.display = 'table-row';
    }
  } else if (tabName === 'details') {
    // Show details tab
    detailsTab.classList.add('active');
    citationsTab.classList.remove('active');
    detailsTab.style.color = 'var(--text-primary)';
    detailsTab.style.borderBottomColor = 'var(--accent-color)';
    citationsTab.style.color = 'var(--text-secondary)';
    citationsTab.style.borderBottomColor = 'transparent';
    
    // Handle underline visibility
    const citationsUnderline = citationsTab.querySelector('.tab-underline');
    const detailsUnderline = detailsTab.querySelector('.tab-underline');
    if (citationsUnderline) citationsUnderline.style.opacity = '0';
    if (detailsUnderline) detailsUnderline.style.opacity = '1';
    
    citationsContainer.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Show header for word count details
    if (panelHeader) {
      panelHeader.style.display = 'block';
    }
    
    // Hide search row when in details tab
    if (searchRow) {
      searchRow.style.display = 'none';
    }
    
    // Update the time calculations when switching to details tab
    updateTimeDetails();
  }
}

// Mobile tab switching functionality
function switchPanelTabMobile(tabName) {
  const citationsTab = document.getElementById('citations-tab-mobile');
  const detailsTab = document.getElementById('details-tab-mobile');
  const citationsContainer = document.querySelector('#citations-overlay .overflow-x-auto');
  const detailsContainer = document.getElementById('word-count-details-container-mobile');
  const mobileHeader = document.getElementById('mobile-panel-header');
  const mobilePanelTitle = document.getElementById('mobile-panel-title');
  const searchRow = document.getElementById('citations-search-row-mobile');

  if (tabName === 'citations') {
    // Show citations tab
    citationsTab.classList.add('active');
    detailsTab.classList.remove('active');
    citationsTab.style.color = 'var(--text-primary)';
    citationsTab.style.borderBottomColor = 'var(--accent-color)';
    detailsTab.style.color = 'var(--text-secondary)';
    detailsTab.style.borderBottomColor = 'transparent';
    
    // Handle underline visibility
    const citationsUnderline = citationsTab.querySelector('.tab-underline');
    const detailsUnderline = detailsTab.querySelector('.tab-underline');
    if (citationsUnderline) citationsUnderline.style.opacity = '1';
    if (detailsUnderline) detailsUnderline.style.opacity = '0';
    
    citationsContainer.style.display = 'block';
    detailsContainer.style.display = 'none';
    
    // Hide header for citations
    if (mobileHeader) {
      mobileHeader.style.display = 'none';
    }
    
    // Show search row only if there are citations
    if (searchRow && state.citationGroups.size > 0) {
      searchRow.style.display = 'table-row';
    }
  } else if (tabName === 'details') {
    // Show details tab
    detailsTab.classList.add('active');
    citationsTab.classList.remove('active');
    detailsTab.style.color = 'var(--text-primary)';
    detailsTab.style.borderBottomColor = 'var(--accent-color)';
    citationsTab.style.color = 'var(--text-secondary)';
    citationsTab.style.borderBottomColor = 'transparent';
    
    // Handle underline visibility
    const citationsUnderline = citationsTab.querySelector('.tab-underline');
    const detailsUnderline = detailsTab.querySelector('.tab-underline');
    if (citationsUnderline) citationsUnderline.style.opacity = '0';
    if (detailsUnderline) detailsUnderline.style.opacity = '1';
    
    citationsContainer.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Show header for word count details
    if (mobileHeader) {
      mobileHeader.style.display = 'block';
    }
    
    // Hide search row when in details tab
    if (searchRow) {
      searchRow.style.display = 'none';
    }
    
    // Update mobile title
    if (mobilePanelTitle) {
      mobilePanelTitle.textContent = 'Word Count Details';
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
  
  // Update the desktop display
  const speakingTimeElement = document.getElementById('speaking-time');
  const readingTimeElement = document.getElementById('reading-time');
  
  if (speakingTimeElement) {
    speakingTimeElement.textContent = speakingTime;
  }
  
  if (readingTimeElement) {
    readingTimeElement.textContent = readingTime;
  }
  
  // Update the mobile display
  const speakingTimeMobileElement = document.getElementById('speaking-time-mobile');
  const readingTimeMobileElement = document.getElementById('reading-time-mobile');
  
  if (speakingTimeMobileElement) {
    speakingTimeMobileElement.textContent = speakingTime;
  }
  
  if (readingTimeMobileElement) {
    readingTimeMobileElement.textContent = readingTime;
  }

  // Store times for counter display
  state.speakingTime = speakingTime;
  state.readingTime = readingTime;
  
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
    'details-citations': state.citationGroups?.size || 0
  };
  
  // Mobile detail tab elements
  const mobileElements = {
    'details-words-no-citations-mobile': state.wordsNoCitations,
    'details-words-with-citations-mobile': state.wordsWithCitations,
    'details-chars-no-citations-mobile': state.charsNoCitations, 
    'details-chars-with-citations-mobile': state.charsWithCitations,
    'details-citations-mobile': state.citationGroups?.size || 0
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
        value.textContent = state.citationGroups.size;
        break;
      case 'speakingTime':
        value.textContent = state.speakingTime || '0 sec';
        break;
      case 'readingTime':
        value.textContent = state.readingTime || '0 sec';
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
    readingTime: 'Estimated time to read the text (200 words/min)'
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
//   window.cookieConsent = new CookieConsent();
// });