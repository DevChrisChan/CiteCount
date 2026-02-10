// Search functionality for the editor
(function() {
  let searchState = {
    query: '',
    matches: [],
    currentIndex: -1,
    isActive: false
  };

  // Initialize search functionality
  function initSearch() {
    const searchBox = document.getElementById('search-box');
    const searchInput = document.getElementById('search-input');
    const searchPrev = document.getElementById('search-prev');
    const searchNext = document.getElementById('search-next');
    const searchClose = document.getElementById('search-close');
    const searchResults = document.getElementById('search-results');
    const editor = document.getElementById('editor');

    if (!searchBox || !searchInput || !editor) return;

    // Make search box draggable
    initDraggable(searchBox, searchInput);

    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Cmd+F (Mac) or Ctrl+F (Windows/Linux) to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        openSearch();
        return;
      }

      // Escape to close search (global, even when unfocused)
      if (e.key === 'Escape' && searchState.isActive) {
        e.preventDefault();
        closeSearch();
        return;
      }

      // Enter/Shift+Enter for navigation when search is active
      if (searchState.isActive && e.key === 'Enter' && document.activeElement === searchInput) {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
      }
    });

    // Search input events
    searchInput.addEventListener('input', function() {
      performSearch(this.value);
    });

    // Navigation buttons
    searchPrev.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToPrevious();
    });
    
    searchNext.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToNext();
    });
    
    searchClose.addEventListener('click', function(e) {
      e.preventDefault();
      closeSearch();
    });
  }

  // Make search box draggable
  function initDraggable(searchBox, searchInput) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    searchBox.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      // Don't drag if clicking on input or buttons
      if (e.target === searchInput || 
          e.target.closest('button') || 
          e.target.closest('input')) {
        return;
      }

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      isDragging = true;
      searchBox.classList.add('dragging');
      e.preventDefault();
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const boxWidth = searchBox.offsetWidth;
        const boxHeight = searchBox.offsetHeight;

        // Calculate the initial position (top-right corner)
        const rect = searchBox.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(searchBox);
        const initialTop = parseFloat(computedStyle.top) || 0;
        const initialRight = parseFloat(computedStyle.right) || 0;

        // Current position in viewport
        let newX = initialRight - currentX;
        let newY = initialTop + currentY;

        // Keep within viewport bounds
        newX = Math.max(-viewportWidth + boxWidth - 10, Math.min(viewportWidth - 10, newX));
        newY = Math.max(10, Math.min(viewportHeight - boxHeight - 10, newY));

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, searchBox);
      }
    }

    function dragEnd(e) {
      if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        searchBox.classList.remove('dragging');
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  }

  function openSearch() {
    const searchBox = document.getElementById('search-box');
    const searchInput = document.getElementById('search-input');
    const editor = document.getElementById('editor');
    
    // Reset position to original (top right of editor)
    searchBox.style.transform = 'translate3d(0, 0, 0)';
    
    // Calculate position relative to editor
    const editorRect = editor.getBoundingClientRect();
    searchBox.style.top = (editorRect.top + 12) + 'px';
    searchBox.style.right = (window.innerWidth - editorRect.right + 12) + 'px';
    searchBox.style.left = 'auto';
    
    searchBox.style.display = 'block';
    searchState.isActive = true;
    
    // Focus the search input
    setTimeout(() => {
      searchInput.focus();
      searchInput.select();
    }, 50);

    // If there's already a query, perform search
    if (searchInput.value) {
      performSearch(searchInput.value);
    }
  }

  function closeSearch() {
    const searchBox = document.getElementById('search-box');
    const searchInput = document.getElementById('search-input');
    const editor = document.getElementById('editor');
    
    searchBox.style.display = 'none';
    searchState.isActive = false;
    searchState.query = '';
    searchState.matches = [];
    searchState.currentIndex = -1;
    
    // Clear highlights
    clearHighlights();
    
    // Return focus to editor
    editor.focus();
    
    // Update UI
    updateSearchResults();
  }

  function performSearch(query) {
    const editor = document.getElementById('editor');
    
    searchState.query = query;
    
    // Clear previous highlights first
    clearHighlights();

    if (!query || query.trim() === '') {
      searchState.matches = [];
      searchState.currentIndex = -1;
      updateSearchResults();
      return;
    }

    // Save current selection/cursor position
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    // Get the plain text content
    const text = editor.textContent;
    const lowerQuery = query.toLowerCase();
    const matches = [];

    // Find all matches
    let index = 0;
    while (index < text.length) {
      const foundIndex = text.toLowerCase().indexOf(lowerQuery, index);
      if (foundIndex === -1) break;
      
      matches.push({
        start: foundIndex,
        end: foundIndex + query.length
      });
      
      index = foundIndex + 1;
    }

    searchState.matches = matches;
    searchState.currentIndex = matches.length > 0 ? 0 : -1;

    // Highlight all matches
    if (matches.length > 0) {
      highlightAllMatches();
      
      // Scroll to first match after a short delay to ensure DOM is updated
      setTimeout(() => {
        scrollToCurrentMatch();
      }, 10);
    }

    updateSearchResults();
  }

  function highlightAllMatches() {
    const editor = document.getElementById('editor');
    if (!searchState.query || searchState.matches.length === 0) return;

    // Get all text nodes
    function getTextNodes(node) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let textNode;
      while (textNode = walker.nextNode()) {
        textNodes.push(textNode);
      }
      return textNodes;
    }

    const textNodes = getTextNodes(editor);
    
    // Build position map for each text node
    let currentPos = 0;
    const nodePositions = [];
    
    textNodes.forEach(textNode => {
      const start = currentPos;
      const length = textNode.textContent.length;
      const end = start + length;
      currentPos = end;
      nodePositions.push({ node: textNode, start, end });
    });

    // Group matches by the text nodes they belong to
    const matchesByNode = new Map();
    
    searchState.matches.forEach((match, matchIndex) => {
      nodePositions.forEach((nodePos, nodeIndex) => {
        if (match.start >= nodePos.end || match.end <= nodePos.start) return;
        
        if (!matchesByNode.has(nodeIndex)) {
          matchesByNode.set(nodeIndex, []);
        }
        
        matchesByNode.get(nodeIndex).push({
          matchIndex,
          localStart: Math.max(0, match.start - nodePos.start),
          localEnd: Math.min(nodePos.node.textContent.length, match.end - nodePos.start)
        });
      });
    });

    // Process each text node that has matches
    matchesByNode.forEach((matches, nodeIndex) => {
      const nodePos = nodePositions[nodeIndex];
      const textNode = nodePos.node;
      
      if (!textNode.parentNode) return;
      
      const text = textNode.textContent;
      const fragment = document.createDocumentFragment();
      
      // Sort matches by position
      matches.sort((a, b) => a.localStart - b.localStart);
      
      let lastPos = 0;
      
      matches.forEach(({ matchIndex, localStart, localEnd }) => {
        // Add text before match
        if (lastPos < localStart) {
          fragment.appendChild(document.createTextNode(text.substring(lastPos, localStart)));
        }
        
        // Add highlighted match
        const mark = document.createElement('mark');
        mark.className = matchIndex === searchState.currentIndex ? 
          'search-highlight-current' : 'search-highlight';
        mark.dataset.matchIndex = matchIndex;
        mark.textContent = text.substring(localStart, localEnd);
        fragment.appendChild(mark);
        
        lastPos = localEnd;
      });
      
      // Add remaining text after last match
      if (lastPos < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastPos)));
      }
      
      // Replace the text node with the fragment
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }

  function clearHighlights() {
    const editor = document.getElementById('editor');
    const highlights = editor.querySelectorAll('.search-highlight, .search-highlight-current');
    
    highlights.forEach(mark => {
      const text = document.createTextNode(mark.textContent);
      mark.parentNode.replaceChild(text, mark);
    });

    // Normalize the editor to merge adjacent text nodes
    editor.normalize();
  }

  function navigateToNext() {
    if (searchState.matches.length === 0) return;
    
    searchState.currentIndex = (searchState.currentIndex + 1) % searchState.matches.length;
    updateCurrentHighlight();
    scrollToCurrentMatch();
    updateSearchResults();
  }

  function navigateToPrevious() {
    if (searchState.matches.length === 0) return;
    
    searchState.currentIndex = searchState.currentIndex - 1;
    if (searchState.currentIndex < 0) {
      searchState.currentIndex = searchState.matches.length - 1;
    }
    
    updateCurrentHighlight();
    scrollToCurrentMatch();
    updateSearchResults();
  }

  function updateCurrentHighlight() {
    const editor = document.getElementById('editor');
    
    // Remove current highlighting from all marks
    editor.querySelectorAll('.search-highlight-current').forEach(mark => {
      mark.className = 'search-highlight';
    });

    // Add current highlighting to the active match
    const currentMark = editor.querySelector(`[data-match-index="${searchState.currentIndex}"]`);
    if (currentMark) {
      currentMark.className = 'search-highlight-current';
    }
  }

  function scrollToCurrentMatch() {
    const editor = document.getElementById('editor');
    const currentMark = editor.querySelector(`[data-match-index="${searchState.currentIndex}"]`);
    
    if (currentMark) {
      // Get the position of the mark relative to the viewport
      const markRect = currentMark.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      
      // Check if the mark is outside the visible area
      const isOutOfView = (
        markRect.top < editorRect.top ||
        markRect.bottom > editorRect.bottom ||
        markRect.left < editorRect.left ||
        markRect.right > editorRect.right
      );

      if (isOutOfView) {
        // Scroll to the mark
        currentMark.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }

  function updateSearchResults() {
    const searchResults = document.getElementById('search-results');
    const searchPrev = document.getElementById('search-prev');
    const searchNext = document.getElementById('search-next');

    if (searchState.matches.length === 0) {
      searchResults.textContent = searchState.query ? 'No results' : '';
      searchPrev.disabled = true;
      searchNext.disabled = true;
    } else {
      searchResults.textContent = `${searchState.currentIndex + 1}/${searchState.matches.length}`;
      searchPrev.disabled = false;
      searchNext.disabled = false;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  // Export functions for external use if needed
  window.editorSearch = {
    open: openSearch,
    close: closeSearch
  };
})();
