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
  updateWordTargetUI();
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
    const isCitation = state.includedCitations.get(citationText) !== false;
    if (isCitation) {
      state.citationWords += group.wordCount * group.count;
    }
  });
}

function calculateCitationChars() {  // Added
  state.citationChars = 0;
  state.citationGroups.forEach((group, citationText) => {
    const isCitation = state.includedCitations.get(citationText) !== false;
    if (isCitation) {
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
  slider.className = 'w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-["""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600';
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
  updateWordTargetUI();
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

document.querySelectorAll('#toolbar button[data-tooltip]').forEach((button) => {
      if (!button.title) {
        button.title = button.getAttribute('data-tooltip') || '';
      }
    });

    (function () {
      const toolbar = document.getElementById('toolbar');
      if (!toolbar) {
        return;
      }

      const tooltip = document.createElement('div');
      tooltip.className = 'toolbar-floating-tooltip';
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltip);

      let activeButton = null;

      function hideTooltip() {
        activeButton = null;
        tooltip.classList.remove('is-visible');
      }

      function positionTooltip(button) {
        const label = button.getAttribute('data-tooltip') || button.title || '';
        if (!label) {
          hideTooltip();
          return;
        }

        tooltip.textContent = label;
        tooltip.classList.add('is-visible');

        const buttonRect = button.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const edgeGap = 8;
        const offset = 10;

        let left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
        left = Math.max(edgeGap, Math.min(left, window.innerWidth - tooltipRect.width - edgeGap));

        let top = buttonRect.bottom + offset;
        if (top + tooltipRect.height > window.innerHeight - edgeGap) {
          top = buttonRect.top - tooltipRect.height - offset;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }

      toolbar.querySelectorAll('button[data-tooltip]').forEach((button) => {
        button.addEventListener('mouseenter', () => {
          activeButton = button;
          positionTooltip(button);
        });

        button.addEventListener('mouseleave', () => {
          hideTooltip();
        });

        button.addEventListener('focus', () => {
          activeButton = button;
          positionTooltip(button);
        });

        button.addEventListener('blur', hideTooltip);
      });

      toolbar.addEventListener('scroll', () => {
        hideTooltip();
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (activeButton) {
          positionTooltip(activeButton);
        }
      });
    })();