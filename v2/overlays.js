function closeOverlays() {
  toggleCitationsOverlay(false);
  toggleSettingsOverlay(false);
  toggleHelpOverlay(false);
  toggleAppsModal(false);
  if (typeof closeDownloadModal === 'function') {
    closeDownloadModal();
  }
  closePastePermissionModal();
  closeWordTargetModal();
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
