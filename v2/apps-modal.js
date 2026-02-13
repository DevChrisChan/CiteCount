/**
 * CiteCount Apps Modal
 * Automatically injects the apps modal and provides toggle functionality
 * Include this script in any page that uses the navbar with More Apps button
 */

(function() {
  'use strict';

  const APPS_ORDER_KEY = 'citecount-apps-order-v1';

  // Apps modal HTML template
  const appsModalHTML = `
    <div id="apps-modal" class="apps-modal" style="display: none; z-index:100000">
      <div class="apps-modal-controls">
        <span class="apps-modal-title">Applications</span>
        <div class="apps-modal-actions">
          <button type="button" class="apps-reset-order" aria-hidden="true">Reset</button>
          <button type="button" class="apps-edit-toggle" aria-pressed="false">Customize</button>
        </div>
      </div>
      <div class="apps-grid">
        <a href="/" class="app-card" data-app-id="citecount" data-lta-event="v2-more-apps-citecount-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          </div>
          <span class="app-title">CiteCount</span>
        </a>
        <a href="/generate/" class="app-card" data-app-id="citation-generator" data-lta-event="v2-more-apps-citation-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191.029 191.029" width="20" height="20">
                <path fill="white" d="M44.33,88.474v15.377h38.417v82.745H0v-82.745h0.002V88.474c0-31.225,8.984-54.411,26.704-68.918 C38.964,9.521,54.48,4.433,72.824,4.433v44.326C62.866,48.759,44.33,48.759,44.33,88.474z M181.107,48.759V4.433 c-18.343,0-33.859,5.088-46.117,15.123c-17.72,14.507-26.705,37.694-26.705,68.918v15.377h0v82.745h82.744v-82.745h-38.417V88.474 C152.613,48.759,171.149,48.759,181.107,48.759z"/>
              </svg>
            </div>
            <span class="app-beta-badge">BETA</span>
          </div>
          <span class="app-title">Citation Generator</span>
        </a>
        <a href="/countdown/" class="app-card" data-app-id="countdown-m26" data-lta-event="v2-more-apps-countdown-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <span class="app-title">IB M26 Exams Countdown</span>
        </a>
        <a href="/countdown/n26/" class="app-card" data-app-id="countdown-n26" data-lta-event="v2-more-apps-countdown-n26-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #70e1f5 0%, #ffd194 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <span class="app-title">IB N26 Exams Countdown</span>
        </a>
        <a href="/exam-timer/" class="app-card" data-app-id="exam-timer" data-lta-event="v2-more-apps-mocks-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
                <line x1="12" y1="2" x2="12" y2="4"/>
                <line x1="12" y1="20" x2="12" y2="22"/>
              </svg>
            </div>
          </div>
          <span class="app-title">Exam Timer</span>
        </a>
        <a href="/ib-resources/" class="app-card" data-app-id="ib-resources" data-lta-event="v2-more-apps-ib-resources-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
          </div>
          <span class="app-title">IB Resources</span>
        </a>
        <a href="/ib-results/" class="app-card" data-app-id="ib-results" data-lta-event="v2-more-apps-bulletin-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" width="32" height="32">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
          </div>
          <span class="app-title">Simulate IB Results</span>
        </a>
        <a href="/blogs" class="app-card" data-app-id="blogs" data-lta-event="v2-more-apps-blogs-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          </div>
          <span class="app-title">Blogs & Guides</span>
        </a>
        <a href="/contact.html" class="app-card" data-app-id="contact" data-lta-event="v2-more-apps-contact-click">
          <div class="app-icon-wrapper">
            <div class="app-icon" style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="32" height="32">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>
          <span class="app-title">Contact</span>
        </a>
      </div>
    </div>
  `;

  // Inject the apps modal when DOM is ready
  function injectAppsModal() {
    // Check if modal already exists
    if (document.getElementById('apps-modal')) {
      return;
    }

    // Insert modal after header or at the end of body
    const header = document.querySelector('header');
    if (header && header.nextSibling) {
      header.insertAdjacentHTML('afterend', appsModalHTML);
    } else {
      document.body.insertAdjacentHTML('beforeend', appsModalHTML);
    }

    const modal = document.getElementById('apps-modal');
    if (modal) {
      initializeAppsReorder(modal);
    }
  }

  // Toggle apps modal function
  window.toggleAppsModal = function(show) {
    const modal = document.getElementById('apps-modal');
    if (!modal) return;
    
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
        document.addEventListener('keydown', closeAppsModalOnEscape);
      }, 100);
    } else {
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.95)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 150);
      document.removeEventListener('click', closeAppsModalOnClickOutside);
      document.removeEventListener('keydown', closeAppsModalOnEscape);
    }
  };

  function closeAppsModalOnClickOutside(event) {
    const modal = document.getElementById('apps-modal');
    const appsButton = document.getElementById('other-apps-btn');
    
    if (modal && !modal.contains(event.target) && !appsButton.contains(event.target)) {
      window.toggleAppsModal(false);
    }
  }

  function closeAppsModalOnEscape(event) {
    if (event.key === 'Escape') {
      window.toggleAppsModal(false);
    }
  }

  function initializeAppsReorder(modal) {
    const grid = modal.querySelector('.apps-grid');
    const toggleButton = modal.querySelector('.apps-edit-toggle');
    const resetButton = modal.querySelector('.apps-reset-order');
    if (!grid || !toggleButton) return;

    const defaultOrder = Array.from(grid.querySelectorAll('.app-card'))
      .map((card) => card.dataset.appId)
      .filter(Boolean);

    applySavedOrder(grid);
    setEditMode(modal, toggleButton, resetButton, false);

    toggleButton.addEventListener('click', () => {
      const isEditing = modal.classList.toggle('apps-editing');
      setEditMode(modal, toggleButton, resetButton, isEditing);
    });

    if (resetButton) {
      resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        restoreDefaultOrder(grid, defaultOrder);
        // Auto-exit customize mode
        modal.classList.remove('apps-editing');
        setEditMode(modal, toggleButton, resetButton, false);
      });
    }

    grid.addEventListener('dragstart', (event) => {
      const card = event.target.closest('.app-card');
      if (!card || !modal.classList.contains('apps-editing')) return;
      card.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.appId || '');
    });

    grid.addEventListener('click', (event) => {
      if (modal.classList.contains('apps-editing')) {
        event.preventDefault();
      }
    });

    grid.addEventListener('dragover', (event) => {
      if (!modal.classList.contains('apps-editing')) return;
      event.preventDefault();
      const dragging = grid.querySelector('.app-card.dragging');
      if (!dragging) return;
      const target = getDragTarget(grid, event.clientX, event.clientY);
      clearDropIndicators(grid);
      if (!target || target === dragging) return;
      target.element.classList.add('drop-indicator');
      if (target.insertAfter) {
        if (target.element.nextElementSibling) {
          grid.insertBefore(dragging, target.element.nextElementSibling);
        } else {
          grid.appendChild(dragging);
        }
      } else {
        grid.insertBefore(dragging, target.element);
      }
    });

    grid.addEventListener('drop', (event) => {
      if (!modal.classList.contains('apps-editing')) return;
      event.preventDefault();
      clearDropIndicators(grid);
      saveOrder(grid);
    });

    grid.addEventListener('dragend', (event) => {
      const card = event.target.closest('.app-card');
      if (card) {
        card.classList.remove('dragging');
      }
      clearDropIndicators(grid);
      if (modal.classList.contains('apps-editing')) {
        saveOrder(grid);
      }
    });
  }

  function setEditMode(modal, toggleButton, resetButton, isEditing) {
    modal.classList.toggle('apps-editing', isEditing);
    toggleButton.setAttribute('aria-pressed', isEditing ? 'true' : 'false');
    toggleButton.textContent = isEditing ? 'Done' : 'Customize';
    if (resetButton) {
      resetButton.setAttribute('aria-hidden', isEditing ? 'false' : 'true');
    }
    const cards = modal.querySelectorAll('.app-card');
    cards.forEach((card) => {
      card.setAttribute('draggable', isEditing ? 'true' : 'false');
    });
  }

  function getDragTarget(grid, x, y) {
    const target = document.elementFromPoint(x, y);
    const card = target ? target.closest('.app-card') : null;
    if (!card || !grid.contains(card) || card.classList.contains('dragging')) {
      return null;
    }
    const rect = card.getBoundingClientRect();
    const insertAfter = y > rect.top + rect.height / 2 || (
      y > rect.top + rect.height / 4 && y < rect.top + rect.height * 0.75 && x > rect.left + rect.width / 2
    );
    return { element: card, insertAfter };
  }

  function applySavedOrder(grid) {
    const order = readSavedOrder();
    if (!order || !order.length) return;

    const cards = Array.from(grid.querySelectorAll('.app-card'));
    const cardMap = new Map(cards.map((card) => [card.dataset.appId, card]));
    const fragment = document.createDocumentFragment();

    order.forEach((id) => {
      const card = cardMap.get(id);
      if (card) {
        fragment.appendChild(card);
        cardMap.delete(id);
      }
    });

    cardMap.forEach((card) => fragment.appendChild(card));
    grid.appendChild(fragment);
  }

  function readSavedOrder() {
    try {
      const raw = localStorage.getItem(APPS_ORDER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveOrder(grid) {
    const order = Array.from(grid.querySelectorAll('.app-card'))
      .map((card) => card.dataset.appId)
      .filter(Boolean);
    try {
      localStorage.setItem(APPS_ORDER_KEY, JSON.stringify(order));
    } catch (error) {
      // Ignore storage errors silently.
    }
  }

  function restoreDefaultOrder(grid, defaultOrder) {
    const cards = Array.from(grid.querySelectorAll('.app-card'));
    const cardMap = new Map(cards.map((card) => [card.dataset.appId, card]));
    const fragment = document.createDocumentFragment();

    defaultOrder.forEach((id) => {
      const card = cardMap.get(id);
      if (card) {
        fragment.appendChild(card);
        cardMap.delete(id);
      }
    });

    cardMap.forEach((card) => fragment.appendChild(card));
    grid.appendChild(fragment);

    try {
      localStorage.removeItem(APPS_ORDER_KEY);
    } catch (error) {
      // Ignore storage errors silently.
    }
  }

  function clearDropIndicators(grid) {
    const current = grid.querySelector('.app-card.drop-indicator');
    if (current) {
      current.classList.remove('drop-indicator');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAppsModal);
  } else {
    injectAppsModal();
  }
})();
