/**
 * CiteCount Custom Tools Manager
 * Handles tab pinning and tool filtering in the panels
 */

(function() {
  'use strict';

  // Tool display names mapping with emojis
  const TOOL_NAMES_WITH_EMOJI = {
    'citations': '📚 Citations',
    'generateCitation': '📝 Generate Citation',
    'details': '📊 Word Count Details',
    'dictionary': '📖 Dictionary',
    'thesaurus': '🧠 Thesaurus',
    'pomodoro': '🍅 Pomodoro Timer',
    'translate': '🌐 Translate',
    'notepad': '📓 Notepad',
    'wordbank': '📚 Word Bank'
  };

  // Tool display names without emojis (for tabs)
  const TOOL_NAMES = {
    'citations': 'Citations',
    'generateCitation': 'Generate Citation',
    'details': 'Word Count Details',
    'dictionary': 'Dictionary',
    'thesaurus': 'Thesaurus',
    'pomodoro': 'Pomodoro Timer',
    'translate': 'Translate',
    'notepad': 'Notepad',
    'wordbank': 'Word Bank'
  };

  // Track which tool is being viewed from More Tools
  let currentMoreToolView = null;

  // Get pinned tools from localStorage (Tab 2 and Tab 3)
  function getPinnedTools() {
    const stored = localStorage.getItem('pinnedTools');
    return stored ? JSON.parse(stored) : ['generateCitation', 'details'];
  }

  // Update tab labels to show pinned tool names
  function updateTabLabels(pinnedTools) {
    // Tab 1 always shows Citations
    const tab1Label = document.querySelector('#citations-tab .tab-label');
    const citationsTab = document.getElementById('citations-tab');
    if (tab1Label) {
      tab1Label.textContent = TOOL_NAMES['citations'];
    }
    if (citationsTab) {
      citationsTab.onclick = function(e) { 
        e.preventDefault();
        switchPanelTab('citations'); 
      };
    }

    // Tab 2 shows first pinned tool
    const tab2Button = document.getElementById('generate-citation-tab');
    if (tab2Button) {
      const tab2Label = tab2Button.querySelector('.tab-label');
      if (tab2Label && pinnedTools[0]) {
        const toolName = TOOL_NAMES[pinnedTools[0]];
        tab2Label.textContent = toolName || pinnedTools[0];
      }
      // Update data attribute
      if (pinnedTools[0]) {
        tab2Button.setAttribute('data-tool-id', pinnedTools[0]);
      }
      // Update onclick handler - capture the tool ID in a closure
      const pinned0 = pinnedTools[0];
      tab2Button.onclick = function(e) { 
        e.preventDefault();
        switchPanelTab(pinned0); 
      };
    }

    // Tab 3 shows second pinned tool
    const tab3Button = document.getElementById('details-tab');
    if (tab3Button) {
      const tab3Label = tab3Button.querySelector('.tab-label');
      if (tab3Label && pinnedTools[1]) {
        const toolName = TOOL_NAMES[pinnedTools[1]];
        tab3Label.textContent = toolName || pinnedTools[1];
      }
      // Update data attribute
      if (pinnedTools[1]) {
        tab3Button.setAttribute('data-tool-id', pinnedTools[1]);
      }
      // Update onclick handler - capture the tool ID in a closure
      const pinned1 = pinnedTools[1];
      tab3Button.onclick = function(e) { 
        e.preventDefault();
        switchPanelTab(pinned1); 
      };
    }

    // Set up hamburger menu button
    const menuBtn = document.getElementById('details-menu-btn');
    if (menuBtn) {
      menuBtn.onclick = function(e) {
        e.preventDefault();
        openMoreAppsTab();
      };
    }
  }

  // Initialize tools display on page load
  function initializeToolsDisplay() {
    const pinnedTools = getPinnedTools();
    
    // Update panel tabs to show pinned tools
    updatePanelTabs(pinnedTools);
    
    // Update tab labels with tool names
    updateTabLabels(pinnedTools);
    
    // Show unpinned core tools in More Tools
    showAllMoreTools(pinnedTools);

    // Set Citations (Tab 1) as active by default
    if (typeof switchPanelTab === 'function') {
      setTimeout(() => {
        switchPanelTab('citations');
      }, 100);
    }
  }

  // Update the visible tabs in the main panel
  function updatePanelTabs(pinnedTools) {
    // Always show Citations tab (Tab 1)
    const citationsTab = document.getElementById('citations-tab');
    if (citationsTab) {
      citationsTab.style.display = 'inline-block';
    }

    // Always show Tab 2 button (for first pinned tool)
    const tab2Button = document.getElementById('generate-citation-tab');
    if (tab2Button) {
      tab2Button.style.display = 'inline-block';
    }

    // Always show Tab 3 button (for second pinned tool)
    const tab3Button = document.getElementById('details-tab');
    if (tab3Button) {
      tab3Button.style.display = 'inline-block';
    }

    // Always show hamburger menu
    const menuBtn = document.getElementById('details-menu-btn');
    if (menuBtn) {
      menuBtn.style.display = 'flex';
    }

    // Show divider before menu
    const dividerBeforeMenu = document.getElementById('divider-before-menu');
    if (dividerBeforeMenu) {
      dividerBeforeMenu.style.display = 'block';
    }
  }

  // Show all tools in the More Tools grid (only unpinned ones)
  function showAllMoreTools(pinnedTools = []) {
    const toolsGrid = document.getElementById('tools-grid');
    if (!toolsGrid) return;

    const allToolBoxes = toolsGrid.querySelectorAll('.tool-box');
    
    // Show all tool boxes
    allToolBoxes.forEach(toolBox => {
      toolBox.style.display = 'flex';
    });

    // Ensure core tools (generateCitation, details) appear as tool boxes in More Tools if not pinned
    // Create containers for them if needed in the grid
    let generateCitationBox = document.getElementById('generate-citation-tool-box');
    let detailsBox = document.getElementById('word-count-details-tool-box');

    // Show/hide generateCitation in More Tools based on pinning
    if (!pinnedTools.includes('generateCitation')) {
      if (!generateCitationBox) {
        // Create it
        generateCitationBox = document.createElement('div');
        generateCitationBox.id = 'generate-citation-tool-box';
        generateCitationBox.className = 'tool-box';
        generateCitationBox.setAttribute('data-tool-id', 'generateCitation');
        generateCitationBox.style.cssText = 'padding: 1.5rem; border: 1px solid var(--border-primary); border-radius: 0.5rem; background: var(--background-secondary); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column;';
        generateCitationBox.innerHTML = '<h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">📝 Generate Citation</h3><p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">Create formatted citations in MLA, APA, Harvard and more styles.</p>';
        generateCitationBox.onclick = function() { switchPanelTab('generateCitation', true); };
        toolsGrid.insertAdjacentElement('afterbegin', generateCitationBox);
      } else {
        generateCitationBox.style.display = 'flex';
      }
    } else if (generateCitationBox) {
      generateCitationBox.style.display = 'none';
    }

    // Show/hide details in More Tools based on pinning
    if (!pinnedTools.includes('details')) {
      if (!detailsBox) {
        // Create it
        detailsBox = document.createElement('div');
        detailsBox.id = 'word-count-details-tool-box';
        detailsBox.className = 'tool-box';
        detailsBox.setAttribute('data-tool-id', 'details');
        detailsBox.style.cssText = 'padding: 1.5rem; border: 1px solid var(--border-primary); border-radius: 0.5rem; background: var(--background-secondary); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column;';
        detailsBox.innerHTML = '<h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">📊 Word Count Details</h3><p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">View detailed statistics including reading time, character count, and more.</p>';
        detailsBox.onclick = function() { switchPanelTab('details', true); };
        toolsGrid.insertAdjacentElement('afterbegin', detailsBox);
      } else {
        detailsBox.style.display = 'flex';
      }
    } else if (detailsBox) {
      detailsBox.style.display = 'none';
    }

    // Add a "Customise Tools" button at the bottom of the grid
    let customiseToolsBtn = document.getElementById('customise-tools-btn');
    if (!customiseToolsBtn) {
      // Create it
      customiseToolsBtn = document.createElement('div');
      customiseToolsBtn.id = 'customise-tools-btn';
      customiseToolsBtn.className = 'tool-box';
      customiseToolsBtn.style.cssText = 'padding: 1.5rem; border: 2px dashed var(--border-primary); border-radius: 0.5rem; background: transparent; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 120px;';
      customiseToolsBtn.innerHTML = '<div style="font-size: 2rem; margin-bottom: 0.5rem;">⚙️</div><h3 style="font-size: 1rem; font-weight: 600; margin: 0; color: var(--text-primary);">Customize Tools</h3><p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.5rem 0 0; line-height: 1.4;">Choose which tools to pin</p>';
      customiseToolsBtn.onclick = function() { openToolsSettingsPage(); };
      
      // Add hover effects
      customiseToolsBtn.onmouseover = () => {
        customiseToolsBtn.style.borderColor = 'var(--accent-color)';
        customiseToolsBtn.style.background = 'rgba(var(--accent-color-rgb), 0.05)';
      };
      customiseToolsBtn.onmouseout = () => {
        customiseToolsBtn.style.borderColor = 'var(--border-primary)';
        customiseToolsBtn.style.background = 'transparent';
      };
      
      toolsGrid.appendChild(customiseToolsBtn);
    }
  }

  // Watch for changes in localStorage (when settings are updated)
  function watchForToolsChanges() {
    // Watch for storage events (changes from other tabs/windows)
    window.addEventListener('storage', (e) => {
      if (e.key === 'pinnedTools') {
        setTimeout(() => {
          initializeToolsDisplay();
        }, 200);
      }
    });

    // Watch for custom events (changes in same window)
    window.addEventListener('pinnedToolsChanged', () => {
      setTimeout(() => {
        initializeToolsDisplay();
      }, 200);
    });
  }

  // Initialize when DOM is ready
  function initWhenReady() {
    // Check if DOM elements exist
    const tab1 = document.getElementById('citations-tab');
    const tab2 = document.getElementById('generate-citation-tab');
    const tab3 = document.getElementById('details-tab');
    
    if (tab1 && tab2 && tab3) {
      initializeToolsDisplay();
      watchForToolsChanges();
    } else {
      // If elements not found yet, wait a bit and try again
      setTimeout(initWhenReady, 100);
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenReady);
  } else {
    // DOM is already loaded
    initWhenReady();
  }

  // Export function for manual updates
  window.updateToolsDisplay = function() {
    initializeToolsDisplay();
  };

  // Expose getPinnedTools for other scripts
  window.getPinnedTools = getPinnedTools;
})();
