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
    'wordbank': '📚 Word Bank',
    'scientificCalculator': '🧮 Scientific Calculator',
    'graphingCalculator': '📈 Graphing Calculator'
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
    'wordbank': 'Word Bank',
    'scientificCalculator': 'Scientific Calculator',
    'graphingCalculator': 'Graphing Calculator'
  };

  function getToolDisplayName(toolId, includeIcon = false) {
    if (typeof window.getToolDisplayMeta === 'function') {
      const tool = window.getToolDisplayMeta(toolId);
      if (tool) {
        return includeIcon ? `${tool.icon} ${tool.name}` : tool.name;
      }
    }

    return includeIcon ? (TOOL_NAMES_WITH_EMOJI[toolId] || toolId) : (TOOL_NAMES[toolId] || toolId);
  }

  function createToolBox({ id, icon, name, description, onClick, custom = false, dashed = false }) {
    const toolBox = document.createElement('div');
    toolBox.id = `${id}-tool-box`;
    toolBox.className = 'tool-box';
    toolBox.setAttribute('data-tool-id', id);
    if (custom) {
      toolBox.setAttribute('data-custom-tool-box', 'true');
    }

    toolBox.style.cssText = [
      'padding: 1.25rem',
      `border: ${dashed ? '2px dashed' : '1px solid'} var(--border-primary)`,
      'border-radius: 0.5rem',
      `background: ${dashed ? 'transparent' : 'var(--background-secondary)'}`,
      'cursor: pointer',
      'transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, transform 0.3s ease',
      'display: flex',
      'flex-direction: column',
      'align-items: center',
      'text-align: center'
    ].join('; ');

    toolBox.innerHTML = `<h3 style="font-size: 1.5rem; margin: 0; margin-bottom: 0.5rem;">${icon}</h3><p style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 0.5rem; line-height: 1.3;">${name}</p><p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${description}</p>`;

    toolBox.onclick = onClick;
    toolBox.onmouseover = function() {
      this.style.borderColor = 'var(--accent-color)';
      this.style.boxShadow = '0 10px 24px rgba(15,23,42,0.12)';
      this.style.transform = 'translateY(-2px)';
      this.style.backgroundColor = dashed ? 'rgba(var(--accent-color-rgb), 0.05)' : 'var(--background-primary)';
    };
    toolBox.onmouseout = function() {
      this.style.borderColor = 'var(--border-primary)';
      this.style.boxShadow = 'none';
      this.style.transform = 'translateY(0)';
      this.style.backgroundColor = dashed ? 'transparent' : 'var(--background-secondary)';
    };

    return toolBox;
  }

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
      tab1Label.textContent = getToolDisplayName('citations', false);
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
        const toolName = getToolDisplayName(pinnedTools[0], false);
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
        const toolName = getToolDisplayName(pinnedTools[1], false);
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
        generateCitationBox = createToolBox({
          id: 'generate-citation',
          icon: '📝',
          name: 'Generate Citation',
          description: 'Create formatted citations in MLA, APA, Harvard and more styles.',
          onClick: function() { switchPanelTab('generateCitation', true); }
        });
        generateCitationBox.id = 'generate-citation-tool-box';
        generateCitationBox.setAttribute('data-tool-id', 'generateCitation');
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
        detailsBox = createToolBox({
          id: 'word-count-details',
          icon: '📊',
          name: 'Word Count Details',
          description: 'View detailed statistics including reading time, character count, and more.',
          onClick: function() { switchPanelTab('details', true); }
        });
        detailsBox.id = 'word-count-details-tool-box';
        detailsBox.setAttribute('data-tool-id', 'details');
        toolsGrid.insertAdjacentElement('afterbegin', detailsBox);
      } else {
        detailsBox.style.display = 'flex';
      }
    } else if (detailsBox) {
      detailsBox.style.display = 'none';
    }

    Array.from(toolsGrid.querySelectorAll('[data-custom-tool-box="true"]')).forEach((node) => node.remove());

    const customTools = typeof window.getCustomTools === 'function' ? window.getCustomTools() : [];
    const customiseToolsBtn = document.getElementById('customise-tools-btn');

    customTools.forEach((tool) => {
      const toolBox = createToolBox({
        id: tool.id,
        icon: tool.icon || '🧩',
        name: tool.name,
        description: tool.description,
        custom: true,
        onClick: function() { switchPanelTab(tool.id, true); }
      });
      if (customiseToolsBtn) {
        toolsGrid.insertBefore(toolBox, customiseToolsBtn);
      } else {
        toolsGrid.appendChild(toolBox);
      }
    });

    // Add a "Customise Tools" button on the same line as the tools grid
    let customiseToolsButton = document.getElementById('customise-tools-btn');
    if (!customiseToolsButton) {
      // Create the button and add it to the grid
      customiseToolsButton = createToolBox({
        id: 'customise-tools',
        icon: '⚙️',
        name: 'Customize',
        description: 'Pin your tools',
        dashed: true,
        onClick: function() { openToolsSettingsPage(); }
      });
      customiseToolsButton.id = 'customise-tools-btn';
      toolsGrid.appendChild(customiseToolsButton);
    }

    let marketplaceBtn = document.getElementById('tools-marketplace-btn');
    if (!marketplaceBtn) {
      marketplaceBtn = createToolBox({
        id: 'tools-marketplace',
        icon: '🛍️',
        name: 'Tools Marketplace',
        description: 'Add iframe tools and custom apps',
        dashed: true,
        onClick: function() {
          if (typeof window.openToolsMarketplaceModal === 'function') {
            window.openToolsMarketplaceModal();
          }
        }
      });
      marketplaceBtn.id = 'tools-marketplace-btn';
      toolsGrid.appendChild(marketplaceBtn);
    }

    // Add centered idea line at the bottom
    let contactLine = document.getElementById('tools-contact-line');
    if (!contactLine) {
      contactLine = document.createElement('div');
      contactLine.id = 'tools-contact-line';
      contactLine.style.cssText = 'opacity: 0.7; font-size: 0.875rem; color: var(--text-primary); margin-top: 1.5rem; text-align: center; padding: 0;';
      contactLine.innerHTML = `💡 Have an idea for a tool? <a href="/contact.html" style="text-decoration: underline; color: inherit;">Let us know</a>`;
      toolsGrid.parentElement.appendChild(contactLine);
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

    window.addEventListener('customToolsChanged', () => {
      setTimeout(() => {
        initializeToolsDisplay();
      }, 50);
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
