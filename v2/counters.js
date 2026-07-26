const counterEditorState = {
  active: false,
  draggingKey: null,
  draggingFrom: null,
  dropIndex: null,
  bound: false
};

function openCounterDisplayEditor() {
  const editor = document.getElementById('counter-display-editor');
  if (!editor) return;

  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsOpen = settingsOverlay?.classList.contains('open');
  editor.dataset.returnToSettings = settingsOpen ? 'true' : 'false';

  if (settingsOpen) {
    toggleSettingsOverlay(false);
    if (settingsOverlay?.classList.contains('open')) {
      return;
    }
  }

  editor.style.display = 'flex';
  document.body.classList.add('counter-editing');
  counterEditorState.active = true;

  refreshCounterDisplayEditor();
  bindCounterDisplayEditorEvents();
}

function closeCounterDisplayEditor(returnToSettings) {
  const editor = document.getElementById('counter-display-editor');
  if (!editor) return;

  editor.style.display = 'none';
  document.body.classList.remove('counter-editing');
  counterEditorState.active = false;
  clearCounterDragState();
  applyCounterEditStateToStatsRow();

  const shouldReturn = typeof returnToSettings === 'boolean'
    ? returnToSettings
    : editor.dataset.returnToSettings === 'true';
  editor.dataset.returnToSettings = 'false';

  if (shouldReturn) {
    toggleSettingsOverlay(true);
    switchSettingsCategory('counter', true);
  }
}

function resetCounterDisplayEditor() {
  resetCountersToDefault();
  refreshCounterDisplayEditor();
}

function refreshCounterDisplayEditor() {
  renderCounterAvailableList();
  applyCounterEditStateToStatsRow();
}

function renderCounterAvailableList() {
  const list = document.getElementById('counter-available-list');
  if (!list) return;

  const disabledCounters = getDisabledCounterKeys();
  list.innerHTML = '';
  list.classList.remove('counter-available-drop');

  if (!disabledCounters.length) {
    const empty = document.createElement('div');
    empty.className = 'counter-available-empty';
    empty.textContent = 'All counters are active.';
    list.appendChild(empty);
    return;
  }

  disabledCounters.forEach((key) => {
    const config = state.settings.counters[key];
    const card = document.createElement('div');
    card.className = 'counter-card rounded-lg shadow-sm text-center counter-preview-card counter-available-card';
    card.dataset.counterKey = key;
    card.dataset.counterType = key;
    card.setAttribute('data-tooltip', config.tooltip);
    card.setAttribute('draggable', 'true');

    const title = document.createElement('h3');
    title.className = 'text-xs font-medium opacity-75 mb-1';
    title.textContent = config.shortName;

    const value = document.createElement('p');
    value.className = 'text-2xl font-black counter-preview-value';
    value.textContent = getCounterPreviewValue(key);

    card.appendChild(title);
    card.appendChild(value);
    list.appendChild(card);
  });
}

function getCounterPreviewValue(counterKey) {
  const safeNumber = (value) => (Number.isFinite(value) ? value.toLocaleString() : '0');

  switch (counterKey) {
    case 'wordsNoCitations':
      return safeNumber(state.totalWords - state.citationWords);
    case 'wordsWithCitations':
      return safeNumber(state.totalWords);
    case 'charsNoCitations':
      return safeNumber(state.totalChars - state.citationChars);
    case 'charsWithCitations':
      return safeNumber(state.totalChars);
    case 'citations':
      return safeNumber(getIncludedCitationCount());
    case 'speakingTime':
      return state.speakingTime || '0 sec';
    case 'readingTime':
      return state.readingTime || '0 sec';
    case 'handwritingTime':
      return state.handwritingTime || '0 sec';
    default:
      return '0';
  }
}

function applyCounterEditStateToStatsRow() {
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;

  const cards = statsRow.querySelectorAll('.counter-card');
  cards.forEach((card) => {
    if (counterEditorState.active) {
      card.setAttribute('draggable', 'true');
    } else {
      card.removeAttribute('draggable');
    }
  });
}

function bindCounterDisplayEditorEvents() {
  if (counterEditorState.bound) return;
  counterEditorState.bound = true;

  const statsRow = document.querySelector('.stats-row');
  if (statsRow) {
    statsRow.addEventListener('dragstart', handleCounterCardDragStart);
    statsRow.addEventListener('dragover', handleCounterCardDragOver);
    statsRow.addEventListener('drop', handleCounterCardDrop);
    statsRow.addEventListener('dragend', handleCounterCardDragEnd);
  }

  const availableList = document.getElementById('counter-available-list');
  if (availableList) {
    availableList.addEventListener('dragstart', handleAvailableCounterDragStart);
    availableList.addEventListener('dragover', handleAvailableListDragOver);
    availableList.addEventListener('dragleave', handleAvailableListDragLeave);
    availableList.addEventListener('drop', handleAvailableListDrop);
    availableList.addEventListener('dragend', handleCounterCardDragEnd);
  }

  document.addEventListener('keydown', handleCounterEditorKeydown);
}

function handleCounterEditorKeydown(event) {
  if (!counterEditorState.active) return;
  if (event.key === 'Escape') {
    closeCounterDisplayEditor(false);
  }
}

function handleCounterCardDragStart(event) {
  if (!counterEditorState.active) return;
  const card = event.target.closest('.counter-card');
  if (!card) return;

  const key = card.dataset.counterType;
  if (!key) return;

  counterEditorState.draggingKey = key;
  counterEditorState.draggingFrom = 'active';
  counterEditorState.dropIndex = null;
  card.classList.add('counter-dragging');
  document.body.classList.add('counter-dragging-active');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', key);
}

function handleAvailableCounterDragStart(event) {
  if (!counterEditorState.active) return;
  const item = event.target.closest('.counter-available-card');
  if (!item) return;

  const key = item.dataset.counterKey || item.dataset.counterType;
  if (!key) return;

  counterEditorState.draggingKey = key;
  counterEditorState.draggingFrom = 'available';
  counterEditorState.dropIndex = null;
  item.classList.add('counter-dragging');
  document.body.classList.add('counter-dragging-active');
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('text/plain', key);
}

function handleCounterCardDragOver(event) {
  if (!counterEditorState.active || !counterEditorState.draggingKey) return;
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;

  event.preventDefault();
  const targetCard = event.target.closest('.counter-card');
  clearCounterDropTargets();

  if (!targetCard || !statsRow.contains(targetCard)) {
    placeCounterDropLine(null);
    counterEditorState.dropIndex = getEnabledCounterKeys().length;
    return;
  }

  const rect = targetCard.getBoundingClientRect();
  const insertAfter = event.clientX > rect.left + rect.width / 2;
  placeCounterDropLine(targetCard, insertAfter);

  const enabledKeys = getEnabledCounterKeys();
  const targetKey = targetCard.dataset.counterType;
  const targetIndex = enabledKeys.indexOf(targetKey);
  counterEditorState.dropIndex = targetIndex === -1
    ? enabledKeys.length
    : targetIndex + (insertAfter ? 1 : 0);
}

function handleCounterCardDrop(event) {
  if (!counterEditorState.active || !counterEditorState.draggingKey) return;
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;

  event.preventDefault();
  const dropIndex = counterEditorState.dropIndex;
  applyCounterDrop(counterEditorState.draggingKey, dropIndex);

  clearCounterDragState();
}

function handleCounterCardDragEnd() {
  if (!counterEditorState.active) return;
  clearCounterDragState();
}

function handleAvailableListDragOver(event) {
  if (!counterEditorState.active || counterEditorState.draggingFrom !== 'active') return;
  event.preventDefault();
  clearCounterDropTargets();
  counterEditorState.dropIndex = null;
  event.currentTarget.classList.add('counter-available-drop');
}

function handleAvailableListDragLeave(event) {
  event.currentTarget.classList.remove('counter-available-drop');
}

function handleAvailableListDrop(event) {
  if (!counterEditorState.active || counterEditorState.draggingFrom !== 'active') return;
  event.preventDefault();

  const key = counterEditorState.draggingKey;
  if (!key || !state.settings.counters[key]) return;

  state.settings.counters[key].enabled = false;
  const enabledOrder = getEnabledCounterKeys().filter((item) => item !== key);
  applyCounterOrder(enabledOrder);
  clearCounterDragState();
}

function clearCounterDragState() {
  counterEditorState.draggingKey = null;
  counterEditorState.draggingFrom = null;
  counterEditorState.dropIndex = null;
  clearCounterDropTargets();

  document.querySelectorAll('.counter-card.counter-dragging').forEach((card) => {
    card.classList.remove('counter-dragging');
  });

  document.body.classList.remove('counter-dragging-active');

  const availableList = document.getElementById('counter-available-list');
  if (availableList) {
    availableList.classList.remove('counter-available-drop');
  }
}

function clearCounterDropTargets() {
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;
  const line = statsRow.querySelector('.counter-drop-line');
  if (line) {
    line.remove();
  }
}

function applyCounterDrop(counterKey, dropIndex) {
  if (!counterKey || !state.settings.counters[counterKey]) return;

  const enabledOrder = getEnabledCounterKeys();
  const currentIndex = enabledOrder.indexOf(counterKey);
  const wasEnabled = currentIndex !== -1;

  if (wasEnabled) {
    enabledOrder.splice(currentIndex, 1);
  }

  let insertIndex = typeof dropIndex === 'number' ? dropIndex : enabledOrder.length;
  if (wasEnabled && currentIndex < insertIndex) {
    insertIndex -= 1;
  }

  insertIndex = Math.max(0, Math.min(insertIndex, enabledOrder.length));
  enabledOrder.splice(insertIndex, 0, counterKey);

  state.settings.counters[counterKey].enabled = true;
  applyCounterOrder(enabledOrder);
}

function getCounterDropLine() {
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return null;
  let line = statsRow.querySelector('.counter-drop-line');
  if (!line) {
    line = document.createElement('div');
    line.className = 'counter-drop-line';
  }
  return line;
}

function placeCounterDropLine(targetCard, insertAfter = false) {
  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;
  const line = getCounterDropLine();
  if (!line) return;

  if (!targetCard) {
    statsRow.appendChild(line);
    return;
  }

  if (insertAfter) {
    statsRow.insertBefore(line, targetCard.nextSibling);
  } else {
    statsRow.insertBefore(line, targetCard);
  }
}

function getSortedCounterEntries() {
  return Object.entries(state.settings.counters)
    .sort(([, a], [, b]) => a.order - b.order);
}

function getEnabledCounterKeys() {
  return getSortedCounterEntries()
    .filter(([, config]) => config.enabled)
    .map(([key]) => key);
}

function getDisabledCounterKeys() {
  return getSortedCounterEntries()
    .filter(([, config]) => !config.enabled)
    .map(([key]) => key);
}

function applyCounterOrder(enabledOrder) {
  const disabledOrder = getDisabledCounterKeys().filter((key) => !enabledOrder.includes(key));
  const combinedOrder = [...enabledOrder, ...disabledOrder];

  combinedOrder.forEach((key, index) => {
    if (state.settings.counters[key]) {
      state.settings.counters[key].order = index;
    }
  });

  localStorage.setItem('settings', JSON.stringify(state.settings));
  updateCounterDisplay();
  updateCounterSettings();

  if (counterEditorState.active) {
    refreshCounterDisplayEditor();
  }
}

function loadWordTarget() {
  const storedTarget = localStorage.getItem(WORD_TARGET_STORAGE_KEY);
  const parsedTarget = parseInt(storedTarget, 10);
  state.wordTarget = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;
}

function loadWordTargetMode() {
  const storedMode = localStorage.getItem(WORD_TARGET_MODE_STORAGE_KEY);
  state.wordTargetMode = storedMode === 'limit' ? 'limit' : 'goal';
}

function loadWordTargetBarHidden() {
  state.wordTargetBarHidden = localStorage.getItem(WORD_TARGET_BAR_HIDDEN_KEY) === 'true';
}

function dismissWordTargetBar() {
  state.wordTargetBarHidden = true;
  localStorage.setItem(WORD_TARGET_BAR_HIDDEN_KEY, 'true');
  updateWordTargetUI();
  notify('Word target bar hidden. Open Word Target from the editor toolbar to show it again.');
}

function getSelectedWordTargetMode() {
  const selected = document.querySelector('input[name="word-target-mode"]:checked');
  return selected?.value === 'limit' ? 'limit' : 'goal';
}

function syncWordTargetPresetSelect() {
  const input = document.getElementById('word-target-input');
  const select = document.getElementById('word-target-preset-select');
  if (!input || !select) return;

  const parsed = parseInt(input.value, 10);
  select.value = Number.isFinite(parsed) && WORD_TARGET_PRESET_VALUES.includes(parsed)
    ? String(parsed)
    : '';
}

function onWordTargetPresetSelect(selectEl) {
  const value = parseInt(selectEl.value, 10);
  if (!Number.isFinite(value)) return;

  const input = document.getElementById('word-target-input');
  if (!input) return;

  input.value = String(value);
  clearWordTargetError();
  input.focus();
}

function openWordTargetModal() {
  const modal = document.getElementById('word-target-modal');
  const background = document.getElementById('overlay-background');
  const content = modal?.querySelector('.word-target-content');

  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('open');
    if (content) {
      content.style.animation = 'none';
      void content.offsetWidth;
      content.style.animation = '';
    }
  }
  if (background) {
    background.style.display = 'block';
  }

  const input = document.getElementById('word-target-input');
  if (input) {
    input.value = state.wordTarget ? String(state.wordTarget) : '';
    input.focus();
    input.select();
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveWordTarget();
      }
    };
    input.oninput = () => {
      clearWordTargetError();
      syncWordTargetPresetSelect();
    };
  }

  syncWordTargetPresetSelect();

  const goalRadio = document.getElementById('word-target-mode-goal');
  const limitRadio = document.getElementById('word-target-mode-limit');
  if (goalRadio && limitRadio) {
    goalRadio.checked = state.wordTargetMode !== 'limit';
    limitRadio.checked = state.wordTargetMode === 'limit';
  }

  clearWordTargetError();
}

function closeWordTargetModal() {
  const modal = document.getElementById('word-target-modal');
  const background = document.getElementById('overlay-background');

  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
  if (background) {
    background.style.display = 'none';
  }
}

function setWordTargetError(message) {
  const errorEl = document.getElementById('word-target-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearWordTargetError() {
  const errorEl = document.getElementById('word-target-error');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

function saveWordTarget() {
  const input = document.getElementById('word-target-input');
  if (!input) return;

  const parsedTarget = parseInt(input.value, 10);
  if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
    setWordTargetError('Enter a number greater than 0.');
    return;
  }

  const selectedMode = getSelectedWordTargetMode();
  const modeChanged = state.wordTargetMode !== selectedMode;
  const targetChanged = state.wordTarget !== parsedTarget;
  state.wordTargetMode = selectedMode;
  localStorage.setItem(WORD_TARGET_MODE_STORAGE_KEY, selectedMode);

  state.wordTarget = parsedTarget;
  state.wordTargetBarHidden = false;
  if (modeChanged || targetChanged) {
    state.wordTargetGoalWasMet = false;
  }
  localStorage.setItem(WORD_TARGET_STORAGE_KEY, String(parsedTarget));
  localStorage.removeItem(WORD_TARGET_BAR_HIDDEN_KEY);
  updateWordTargetUI();
  closeWordTargetModal();
}

function clearWordTarget() {
  state.wordTarget = null;
  state.wordTargetBarHidden = false;
  state.wordTargetGoalWasMet = false;
  localStorage.removeItem(WORD_TARGET_STORAGE_KEY);
  localStorage.removeItem(WORD_TARGET_BAR_HIDDEN_KEY);
  updateWordTargetUI();
  closeWordTargetModal();
}

function formatWordTargetCount(value) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}

function wordTargetWordLabel(count) {
  return Math.abs(count) === 1 ? 'word' : 'words';
}

function celebrateWordTargetGoal() {
  const bar = document.getElementById('word-target-bar');
  if (!bar || bar.style.display === 'none') return;

  const rect = bar.getBoundingClientRect();
  const container = document.createElement('div');
  container.className = 'word-target-confetti';
  container.setAttribute('aria-hidden', 'true');

  const colors = ['#3B82F6', '#60A5FA', '#34D399', '#86EFAC', '#FBBF24', '#FDE68A'];
  const originX = rect.left + rect.width * 0.5;
  const originY = rect.top + rect.height * 0.5;

  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('span');
    piece.className = 'word-target-confetti-piece';
    const size = 3 + Math.random() * 3;
    const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
    const distance = 35 + Math.random() * 55;
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size * (0.5 + Math.random() * 0.5)}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--ty', `${Math.sin(angle) * distance - 20}px`);
    piece.style.setProperty('--rot', `${Math.random() * 540}deg`);
    piece.style.animationDelay = `${Math.random() * 0.12}s`;
    container.appendChild(piece);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1100);
}

function updateWordTargetUI() {
  const bar = document.getElementById('word-target-bar');
  const statusEl = document.getElementById('word-target-bar-status');
  const metaEl = document.getElementById('word-target-bar-meta');
  const progressFill = document.getElementById('word-target-bar-fill');

  if (!bar || !statusEl || !metaEl || !progressFill) return;

  const target = state.wordTarget;
  if (!target || state.wordTargetBarHidden) {
    bar.style.display = 'none';
    bar.classList.remove('limit-warning', 'goal-complete');
    state.wordTargetGoalWasMet = false;
    return;
  }

  const mode = state.wordTargetMode === 'limit' ? 'limit' : 'goal';
  const currentCount = Math.max(0, state.wordsNoCitations || 0);
  const remaining = target - currentCount;
  const progressPercentRaw = Math.round((currentCount / target) * 100);
  const progressPercent = Math.min(100, Math.max(0, progressPercentRaw));
  const isMet = remaining <= 0;
  const modeLabel = mode === 'limit' ? 'Limit' : 'Goal';
  const isGoalMet = mode === 'goal' && isMet;

  bar.style.display = 'flex';
  bar.classList.toggle('limit-warning', mode === 'limit' && isMet);
  bar.classList.toggle('goal-complete', isGoalMet);

  if (isGoalMet && !state.wordTargetGoalWasMet) {
    celebrateWordTargetGoal();
  }
  state.wordTargetGoalWasMet = isGoalMet;

  if (remaining > 0) {
    statusEl.textContent = `${formatWordTargetCount(remaining)} ${wordTargetWordLabel(remaining)} to go`;
  } else if (remaining === 0) {
    statusEl.textContent = 'On target';
  } else {
    const over = Math.abs(remaining);
    statusEl.textContent = `${formatWordTargetCount(over)} ${wordTargetWordLabel(over)} over`;
  }

  progressFill.style.width = `${progressPercent}%`;
  progressFill.classList.toggle('complete', isMet);
  metaEl.textContent = `${modeLabel} ${formatWordTargetCount(target)} ${wordTargetWordLabel(target)} • ${Math.max(0, progressPercentRaw)}%`;
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

  if (counterEditorState.active) {
    applyCounterEditStateToStatsRow();
  }

  updateWordTargetUI();
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

  if (counterEditorState.active) {
    refreshCounterDisplayEditor();
  }
  
  // Show confirmation
  showNotification('Counters have been reset to default', false);
}

function updateCounterSettings() {
  const counterSettingsContainer = document.getElementById('counter-settings-container');
  if (!counterSettingsContainer) return;

  // Get all counters sorted by order
  const sortedCounters = Object.entries(state.settings.counters)
    .sort(([, a], [, b]) => a.order - b.order);

  const maxOrder = Math.max(...Object.values(state.settings.counters).map(c => c.order));

  counterSettingsContainer.innerHTML = '';

  sortedCounters.forEach(([key, config]) => {
    const counterDiv = document.createElement('div');
    counterDiv.className = 'counter-setting-row';
    counterDiv.dataset.counterKey = key;

    const infoSection = document.createElement('div');
    infoSection.className = 'counter-setting-info';
    infoSection.setAttribute('role', 'button');
    infoSection.setAttribute('tabindex', '0');
    infoSection.setAttribute('aria-pressed', config.enabled ? 'true' : 'false');

    const titleRow = document.createElement('div');
    titleRow.className = 'counter-setting-title-row';

    const orderBadge = document.createElement('span');
    orderBadge.className = 'counter-setting-order';
    orderBadge.textContent = String(config.order + 1);

    const label = document.createElement('span');
    label.className = 'counter-setting-title';
    label.textContent = config.shortName;

    titleRow.appendChild(orderBadge);
    titleRow.appendChild(label);

    const description = document.createElement('div');
    description.className = 'counter-setting-desc';
    description.textContent = getCounterDescription(key);

    infoSection.appendChild(titleRow);
    infoSection.appendChild(description);

    const actionsSection = document.createElement('div');
    actionsSection.className = 'counter-setting-actions';

    const reorderDiv = document.createElement('div');
    reorderDiv.className = 'counter-setting-move';

    const upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.className = 'counter-setting-move-btn';
    upButton.disabled = config.order === 0;
    upButton.setAttribute('aria-label', `Move ${config.shortName} up`);
    upButton.textContent = '▲';
    upButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      moveCounterUp(key);
    });

    const downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.className = 'counter-setting-move-btn';
    downButton.disabled = config.order === maxOrder;
    downButton.setAttribute('aria-label', `Move ${config.shortName} down`);
    downButton.textContent = '▼';
    downButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      moveCounterDown(key);
    });

    reorderDiv.appendChild(upButton);
    reorderDiv.appendChild(downButton);

    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'counter-setting-toggle';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.className = 'counter-setting-toggle-input';
    toggleInput.checked = config.enabled;
    toggleInput.setAttribute('aria-label', `Show ${config.shortName}`);
    toggleInput.addEventListener('change', function() {
      toggleCounter(key, this.checked);
      updateCounterSettings();
    });

    const toggleTrack = document.createElement('span');
    toggleTrack.className = 'counter-setting-toggle-track';

    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleTrack);

    actionsSection.appendChild(reorderDiv);
    actionsSection.appendChild(toggleLabel);

    const toggleFromInfo = () => {
      toggleInput.checked = !toggleInput.checked;
      toggleCounter(key, toggleInput.checked);
      updateCounterSettings();
    };

    infoSection.addEventListener('click', toggleFromInfo);
    infoSection.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleFromInfo();
      }
    });

    counterDiv.appendChild(infoSection);
    counterDiv.appendChild(actionsSection);
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
