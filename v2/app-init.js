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
  if (typeof initializeTabContextMenu === 'function') {
    initializeTabContextMenu();
  }
  if (typeof initializeCounterContextMenu === 'function') {
    initializeCounterContextMenu();
  }
  // Update tab labels based on pinned tools
  if (typeof updatePinnedTabLabels === 'function') {
    updatePinnedTabLabels();
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
  loadWordTarget();
  loadWordTargetMode();
  loadWordTargetBarHidden();
  updateWordTargetUI();
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

const allowedDomains = [
  'citecount.netlify.app',
  '127.0.0.1:5500',
  'citecount-priv.netlify.app',
  'cite.js.org',
  'citecount.com'
];

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
