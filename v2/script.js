const state = {
  citations: [],
  citationGroups: new Map(),
  includedCitations: new Map(),
  totalWords: 0,
  citationWords: 0,
  totalChars: 0,        // Added
  citationChars: 0,     // Added
  settings: {
    autoSave: true,
    warnLeave: true,
    spellCheck: true,
    focus: false,
    wordsNoCitations: true,
    charsNoCitations: true,
    wordsWithCitations: true,
    charsWithCitations: true,
    citations: true
  },
  currentOccurrenceIndex: new Map()
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
    state.settings = JSON.parse(savedSettings);
    updateSettingsUI();
  }

  const savedCitationStates = localStorage.getItem('citationStates');
  if (savedCitationStates) {
    state.includedCitations = new Map(JSON.parse(savedCitationStates));
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
  setupAnnouncementBanner();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlays();
    }
  });
});

function closeOverlays() {
  toggleCitationsOverlay(false);
  toggleSettingsOverlay(false);
  toggleHelpOverlay(false);
  document.getElementById('confirmation-overlay').style.display = 'none';
  document.getElementById('overlay-background').style.display = 'none';
  document.getElementById('other-apps-dropdown').classList.add('hidden');
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
    document.body.style.overflow = value ? 'hidden' : 'auto';
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

function updateSettingsUI() {
  for (let [key, value] of Object.entries(state.settings)) {
    const checkbox = document.getElementById(key);
    if (checkbox) checkbox.checked = value;
  }
  document.getElementById('editor').spellcheck = state.settings.spellCheck;
  document.body.style.overflow = state.settings.focus ? 'hidden' : 'auto';
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
    citations: true
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
  'cite.js.org'
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
    if (window.innerWidth >= 1024) {
      split.style.flexDirection = 'row';
      const containerWidth = split.offsetWidth;
      const minWidth = 30;
      const maxWidth = 70;
      const baseWidth = Math.min(maxWidth, Math.max(minWidth, Math.floor(containerWidth * 0.5 / containerWidth * 100)));
      editorPanel.style.flex = `0 0 ${baseWidth}%`;
      citationsPanel.style.flex = `0 0 ${100 - baseWidth}%`;
      citationsPanel.classList.remove('hidden');
    } else {
      split.style.flexDirection = 'column';
      editorPanel.style.flex = '1';
      citationsPanel.style.flex = '0';
      citationsPanel.classList.add('hidden');
    }
  }

  updatePanelFlex();
  window.addEventListener('resize', updatePanelFlex);

  gutter.addEventListener('mousedown', (e) => {
    if (window.innerWidth < 1024) return;
    isResizing = true;
    startX = e.clientX;
    startWidthEditor = editorPanel.offsetWidth;
    startWidthCitations = citationsPanel.offsetWidth;
    document.documentElement.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  });

  function handleMouseMove(e) {
    if (!isResizing) return;
    const container = document.querySelector('.split');
    const containerWidth = container.offsetWidth;
    const movementX = e.clientX - startX;
    const newEditorWidth = (startWidthEditor + movementX) / containerWidth * 100;
    const newCitationsWidth = (startWidthCitations - movementX) / containerWidth * 100;
    const minWidth = 30;
    const maxWidth = 70;
    if (newEditorWidth >= minWidth && newEditorWidth <= maxWidth && newCitationsWidth >= minWidth && newCitationsWidth <= maxWidth) {
      editorPanel.style.flex = `0 0 ${newEditorWidth}%`;
      citationsPanel.style.flex = `0 0 ${newCitationsWidth}%`;
    }
  }

  function stopResize() {
    isResizing = false;
    document.documentElement.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResize);
  }
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

function handleFileDrop(file) {
  const editor = document.getElementById('editor');
  const welcomeText = document.getElementById('welcome-text');
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
  overlay.style.display = show ? 'block' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function toggleSettingsOverlay(show) {
  const overlay = document.getElementById('settings-overlay');
  const background = document.getElementById('overlay-background');
  overlay.style.display = show ? 'block' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function toggleHelpOverlay(show) {
  const overlay = document.getElementById('help-overlay');
  const background = document.getElementById('overlay-background');
  overlay.style.display = show ? 'block' : 'none';
  background.style.display = show ? 'block' : 'none';
}

function formatText(command) {
  document.execCommand(command, false, null);
  document.getElementById('editor').focus();
  handleEditorInput();
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
  state.totalChars = countChars(text);  // Added
  state.citations = findCitations(text);
  groupCitations();
  calculateCitationWords();
  calculateCitationChars();  // Added

  document.getElementById('total-word-count').textContent = state.settings.wordsWithCitations ? state.totalWords : (state.settings.wordsNoCitations ? (state.totalWords - state.citationWords) : '0');
  document.getElementById('filtered-word-count').textContent = state.settings.wordsNoCitations ? (state.totalWords - state.citationWords) : '0';
  document.getElementById('total-char-count').textContent = state.settings.charsWithCitations ? state.totalChars : (state.settings.charsNoCitations ? (state.totalChars - state.citationChars) : '0');  // Added
  document.getElementById('filtered-char-count').textContent = state.settings.charsNoCitations ? (state.totalChars - state.citationChars) : '0';  // Added
  document.getElementById('quote-count').textContent = state.settings.citations ? state.citationGroups.size : '0';

  updateCitationsTables();
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

function updateCitationsTables() {
  const desktopTableBody = document.getElementById('quotes-table-body');
  const mobileTableBody = document.getElementById('quotes-table-body-mobile');
  desktopTableBody.innerHTML = '';
  mobileTableBody.innerHTML = '';

  const rawData = document.getElementById('editor').innerText.trim();
  const selection = window.getSelection();
  const hasSelection = selection.rangeCount > 0 && selection.toString().length > 0;

  if (!rawData) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="4" class="text-center">Start typing, paste your document, or drag and drop your Word / PDF document directly into CiteCount to begin.</td>';
    desktopTableBody.appendChild(emptyRow);
    mobileTableBody.appendChild(emptyRow.cloneNode(true));
  } else if (state.citationGroups.size === 0) {
    const noCitationsRow = document.createElement('tr');
    noCitationsRow.innerHTML = '<td colspan="4" class="text-center">No citations detected' + (hasSelection ? ' in selection' : '') + '</td>';
    desktopTableBody.appendChild(noCitationsRow);
    mobileTableBody.appendChild(noCitationsRow.cloneNode(true));
  } else {
    state.citationGroups.forEach((group, citationText) => {
      createCitationRow(desktopTableBody, group, citationText);
      createCitationRow(mobileTableBody, group, citationText);
    });
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
    handleEditorInput();
    saveCitationStates();
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
    contentDiv.innerHTML = 'Heads Up!<h2>Accessing CiteCount from third-party hosts compromises your data\'s safety.</h2>Please visit the official CiteCount application at <a href="https://cite.js.org" style="text-decoration: underline;">cite.js.org</a>.<br><br>If you are aware of what you are doing, you can proceed by clicking the close button on the top left.';
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

function setupAnnouncementBanner() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const statsRow = document.querySelector('.stats-row');
  const bannerContent = banner.querySelector('span').textContent;
  const storedBanner = localStorage.getItem('dismissedBanner');

  if (storedBanner !== bannerContent) {
    banner.style.display = 'flex';
    header.style.top = `${banner.offsetHeight}px`;
    updateStatsMargin();
  } else {
    header.style.top = '0';
    updateStatsMargin();
  }
}

function dismissBanner() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const bannerContent = banner.querySelector('span').textContent;
  localStorage.setItem('dismissedBanner', bannerContent);
  banner.style.display = 'none';
  header.style.top = '0';
  updateStatsMargin();
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
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
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

const donationMessages = [
  "Saved you time? A $1 helps us keep saving yours.",
  "Keeping CiteCount free takes work. $2 to help us stick around?",
  "No ads, no cost — just us. $2 could make a difference?",
  "CiteCount got you covered. Spare a buck to keep it running?",
  "CiteCount's free for you. A $1 keeps it going — help us out?",
  "Keep CiteCount ad-free — support us!",
  "You use it, we build it. A $1 keeps CiteCount running?"
];

let hasInteracted = false;
let alertTimeout;

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
  if (hasUserDismissedAlert()) return;
  const alert = document.getElementById('donation-alert');
  const messageElement = document.getElementById('donation-message');
  const randomMessage = donationMessages[Math.floor(Math.random() * donationMessages.length)];
  messageElement.textContent = randomMessage;
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
  window.open('https://buymeacoffee.com/cite', '_blank');
  hideDonationAlert();
  localStorage.removeItem('donationAlertDismissedTimestamp');
}

document.getElementById('editor').addEventListener('click', function() {
  if (!hasInteracted && !hasUserDismissedAlert()) {
    hasInteracted = true;
    alertTimeout = setTimeout(showDonationAlert, 10000);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  hideDonationAlert();
});