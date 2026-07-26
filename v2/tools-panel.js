// Tab switching functionality - supports all 8 tools
let contextMenuTargetTabId = null;
let contextMenuTargetTabIndex = -1;
let counterContextMenuInitialized = false;
let currentActiveIframe = null;
let moreToolsNavigationHistory = ['moreApps']; // Start with More Tools page
let moreToolsNavigationIndex = 0; // Current position in history

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
  const customTool = typeof window.getCustomToolById === 'function' ? window.getCustomToolById(tabName) : null;
  
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
  const customToolContainer = document.getElementById('custom-tool-container');
  const customToolIframe = document.getElementById('custom-tool-iframe');
  
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
  if (customToolContainer) customToolContainer.style.display = 'none';

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
  } else if (customTool) {
    if (isMoreToolView) {
      if (menuBtn) {
        menuBtn.classList.add('active');
        menuBtn.style.color = 'var(--text-primary)';
        menuBtn.style.borderBottomColor = 'var(--accent-color)';
      }
      if (panelHeader && panelTitle) {
        panelHeader.style.display = 'block';
        panelTitle.innerHTML = `<span onclick="switchPanelTab('moreApps');" style="opacity: 0.5; cursor: pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">More Tools</span> / ${customTool.name}`;
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
        if (panelTitle) panelTitle.textContent = customTool.name;
      }
    }

    if (customToolIframe) {
      if (customToolIframe.src !== customTool.iframeUrl && customToolIframe.getAttribute('src') !== customTool.iframeUrl) {
        customToolIframe.src = customTool.iframeUrl;
      }
      customToolIframe.title = customTool.name;
    }

    if (customToolContainer) customToolContainer.style.display = 'flex';
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
  if (customTool) {
    currentActiveIframe = 'custom-tool-iframe';
  } else if (iframeToolMap[tabName]) {
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
const baseAvailableTools = [
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

function getAvailableToolsForUI() {
  if (typeof window.getMergedMarketplaceTools === 'function') {
    return window.getMergedMarketplaceTools(baseAvailableTools);
  }
  return baseAvailableTools;
}

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

function initializeCounterContextMenu() {
  if (counterContextMenuInitialized) return;
  counterContextMenuInitialized = true;

  const statsRow = document.querySelector('.stats-row');
  if (!statsRow) return;

  statsRow.addEventListener('contextmenu', (event) => {
    const counterCard = event.target.closest('.counter-card');
    if (!counterCard || !statsRow.contains(counterCard)) return;

    event.preventDefault();
    event.stopPropagation();

    const valueText = getCounterCardValue(counterCard);
    const infoType = getCounterCardInfoType(counterCard);
    openCounterContextMenu(event.clientX, event.clientY, valueText, infoType);
  });

  document.addEventListener('click', (event) => {
    const menu = document.getElementById('counter-context-menu');
    if (menu && !menu.contains(event.target)) {
      closeCounterContextMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCounterContextMenu();
    }
  });

  window.addEventListener('scroll', closeCounterContextMenu, true);
  window.addEventListener('resize', closeCounterContextMenu);
}

function getCounterCardValue(counterCard) {
  const valueEl = counterCard.querySelector('p');
  if (!valueEl) return '';

  const rawValue = (valueEl.textContent || '').trim();
  const match = rawValue.match(/-?[\d,.]+/);
  return match ? match[0] : rawValue;
}

function getCounterCardInfoType(counterCard) {
  const tooltip = (counterCard.getAttribute('data-tooltip') || '').trim();

  switch (tooltip) {
    case 'Words without Citations':
      return 'wordsNoCitations';
    case 'Total Words':
      return 'wordsWithCitations';
    case 'Characters without Citations':
      return 'charsNoCitations';
    case 'Total Characters':
      return 'charsWithCitations';
    case 'Citations':
      return 'citations';
    case 'Speaking Time':
      return 'speaking';
    case 'Reading Time':
      return 'reading';
    case 'Handwriting Time':
      return 'handwriting';
    default:
      return null;
  }
}

function openCounterContextMenu(x, y, valueText, infoType) {
  closeCounterContextMenu();

  const menu = document.createElement('div');
  menu.id = 'counter-context-menu';
  menu.className = 'file-context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.visibility = 'hidden';

  if (infoType) {
    const infoItem = document.createElement('div');
    infoItem.className = 'file-context-menu-item';
    infoItem.textContent = 'Counter Info';
    infoItem.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof showInfoDialogue === 'function') {
        showInfoDialogue(infoType);
      }
      closeCounterContextMenu();
    });

    menu.appendChild(infoItem);
  }

  const copyItem = document.createElement('div');
  copyItem.className = 'file-context-menu-item';
  copyItem.textContent = 'Copy Statistics';
  copyItem.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    copyCounterValue(valueText);
    closeCounterContextMenu();
  });

  const editItem = document.createElement('div');
  editItem.className = 'file-context-menu-item';
  editItem.textContent = 'Edit Counters';
  editItem.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openCounterSettings();
    closeCounterContextMenu();
  });

  menu.appendChild(copyItem);
  menu.appendChild(editItem);
  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  const padding = 8;
  let left = x;
  let top = y;

  if (left + menuRect.width > window.innerWidth - padding) {
    left = window.innerWidth - menuRect.width - padding;
  }

  if (top + menuRect.height > window.innerHeight - padding) {
    top = window.innerHeight - menuRect.height - padding;
  }

  menu.style.left = Math.max(left, padding) + 'px';
  menu.style.top = Math.max(top, padding) + 'px';
  menu.style.visibility = 'visible';
}

function closeCounterContextMenu() {
  const menu = document.getElementById('counter-context-menu');
  if (menu) {
    menu.remove();
  }
}

function copyCounterValue(valueText) {
  const valueToCopy = valueText || '0';
  const showCopySuccess = () => {
    if (typeof notify === 'function') {
      notify('Counter copied to clipboard.');
    } else if (typeof showNotification === 'function') {
      showNotification('Counter copied to clipboard.', false, null, 'success');
    }
  };

  const showCopyError = () => {
    if (typeof notify === 'function') {
      notify('Failed to copy counter.');
    } else if (typeof showNotification === 'function') {
      showNotification('Failed to copy counter.', false, null, 'error');
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(valueToCopy).then(showCopySuccess).catch(() => {
      fallbackCopyText(valueToCopy, showCopySuccess, showCopyError);
    });
  } else {
    fallbackCopyText(valueToCopy, showCopySuccess, showCopyError);
  }
}

function fallbackCopyText(valueToCopy, onSuccess, onError) {
  const textArea = document.createElement('textarea');
  textArea.value = valueToCopy;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError();
    }
  }
  document.body.removeChild(textArea);
}

function openCounterSettings() {
  if (typeof toggleSettingsOverlay === 'function') {
    toggleSettingsOverlay(true);
  }
  if (typeof switchSettingsCategory === 'function') {
    switchSettingsCategory('counter');
  }
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
  
  getAvailableToolsForUI().forEach(tool => {
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
    const tool1 = getAvailableToolsForUI().find(t => t.id === pinnedTools[0]);
    if (tool1) {
      const label = generateCitationTab.querySelector('.tab-label');
      if (label) {
        label.textContent = tool1.name.replace(tool1.icon + ' ', '');
      }
    }
  }
  
  // Update tab 3 label
  if (detailsTab) {
    const tool2 = getAvailableToolsForUI().find(t => t.id === pinnedTools[1]);
    if (tool2) {
      const label = detailsTab.querySelector('.tab-label');
      if (label) {
        label.textContent = tool2.name.replace(tool2.icon + ' ', '');
      }
    }
  }
}

window.updatePinnedTabLabels = updatePinnedTabLabels;
