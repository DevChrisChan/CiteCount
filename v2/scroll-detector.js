/**
 * Intelligent Scroll Detection System
 * Detects accidental scrolling beyond the main app and suggests enabling focus mode
 */

class ScrollDetector {
  constructor() {
    this.hasShownModal = false;
    this.dismissedByUser = false;
    this.scrollEvents = [];
    this.isUserTyping = false;
    this.typingTimeout = null;
    this.lastScrollY = 0;
    this.appHeight = 0;
    this.hasScrolledBeyondApp = false;
    this.scrollBeyondCount = 0;
    
    // Configuration
    this.config = {
      typingDetectionWindow: 3000, // 3 seconds after typing
      scrollThreshold: 200, // pixels beyond app to trigger
      minScrollBeyondCount: 2, // How many times scrolled beyond before showing
      cooldownPeriod: 24 * 60 * 60 * 1000, // 24 hours before showing again
    };

    this.init();
  }

  init() {
    // Check if we're in cooldown period
    const lastDismissed = localStorage.getItem('scrollDetectorDismissed');
    if (lastDismissed) {
      const timeSinceDismissed = Date.now() - parseInt(lastDismissed);
      if (timeSinceDismissed < this.config.cooldownPeriod) {
        this.dismissedByUser = true;
        return;
      }
    }

    // Check if focus mode is already enabled
    if (this.isFocusModeEnabled()) {
      return;
    }

    // Calculate app height
    this.calculateAppHeight();

    // Set up event listeners
    this.setupListeners();
  }

  calculateAppHeight() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      this.appHeight = appContainer.offsetHeight;
    }
  }

  setupListeners() {
    // Detect typing
    const editor = document.getElementById('editor');
    if (editor) {
      editor.addEventListener('input', () => {
        this.onUserTyping();
      });

      editor.addEventListener('keydown', () => {
        this.onUserTyping();
      });
    }

    // Detect scrolling
    window.addEventListener('scroll', () => {
      this.onScroll();
    });

    // Recalculate app height on resize
    window.addEventListener('resize', () => {
      this.calculateAppHeight();
    });
  }

  onUserTyping() {
    this.isUserTyping = true;
    
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set timeout to mark typing as done
    this.typingTimeout = setTimeout(() => {
      this.isUserTyping = false;
    }, this.config.typingDetectionWindow);
  }

  onScroll() {
    if (this.dismissedByUser || this.hasShownModal || this.isFocusModeEnabled()) {
      return;
    }

    const currentScrollY = window.scrollY || window.pageYOffset;
    const beyondApp = currentScrollY - this.appHeight;

    // Check if user has scrolled beyond the app
    if (beyondApp > this.config.scrollThreshold) {
      if (!this.hasScrolledBeyondApp) {
        this.hasScrolledBeyondApp = true;
        this.scrollBeyondCount++;
      }

      // Check if this looks like accidental scrolling
      // (scrolled beyond app while typing recently or multiple times)
      if ((this.isUserTyping || this.scrollBeyondCount >= this.config.minScrollBeyondCount)) {
        this.showFocusModeModal();
      }
    } else {
      this.hasScrolledBeyondApp = false;
    }

    this.lastScrollY = currentScrollY;
  }

  isFocusModeEnabled() {
    try {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      return settings.focus === true;
    } catch (e) {
      return false;
    }
  }

  showFocusModeModal() {
    if (this.hasShownModal) return;
    
    this.hasShownModal = true;

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'focus-mode-suggestion-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in-out;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--background-primary, #ffffff);
      color: var(--text-primary, #000000);
      padding: 2rem;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `;

    modalContent.innerHTML = `
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #focus-mode-suggestion-modal .modal-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        #focus-mode-suggestion-modal h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-align: center;
          color: var(--text-primary, #000000);
        }
        #focus-mode-suggestion-modal p {
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
          opacity: 0.9;
          color: var(--text-secondary, #666666);
        }
        #focus-mode-suggestion-modal .button-group {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        #focus-mode-suggestion-modal button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        #focus-mode-suggestion-modal .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        #focus-mode-suggestion-modal .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        #focus-mode-suggestion-modal .btn-secondary {
          background: var(--background-secondary, #f3f4f6);
          color: var(--text-primary, #000000);
        }
        #focus-mode-suggestion-modal .btn-secondary:hover {
          background: var(--background-tertiary, #e5e7eb);
        }
        #focus-mode-suggestion-modal .feature-highlight {
          background: var(--background-secondary, #f3f4f6);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: left;
        }
        #focus-mode-suggestion-modal .feature-highlight strong {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-primary, #000000);
        }
      </style>
      <div class="modal-icon">🎯</div>
      <h2>Stay Focused While You Write</h2>
      <p>It looks like you accidentally scrolled past the editor. Would you like to enable <strong>Focus Mode</strong>?</p>
      <div class="feature-highlight">
        <strong>Focus Mode hides:</strong>
        <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.8;">
          <li>Blog content below the app</li>
          <li>Extra distractions beyond the editor</li>
        </ul>
        <strong style="margin-top: 0.75rem;">This keeps you concentrated on your writing!</strong>
      </div>
      <div class="button-group">
        <button class="btn-primary" id="enable-focus-btn">
          Enable Focus Mode
        </button>
        <button class="btn-secondary" id="dismiss-focus-btn">
          No Thanks
        </button>
      </div>
      <p style="font-size: 0.875rem; margin-top: 1rem; opacity: 0.7;">
        You can always toggle Focus Mode in Settings later.
      </p>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('enable-focus-btn').addEventListener('click', () => {
      this.enableFocusMode();
      this.closeModal();
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'focus_mode_enabled_from_suggestion', {
          event_category: 'engagement',
          event_label: 'scroll_detection'
        });
      }
    });

    document.getElementById('dismiss-focus-btn').addEventListener('click', () => {
      this.dismissModal();
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'focus_mode_suggestion_dismissed', {
          event_category: 'engagement',
          event_label: 'scroll_detection'
        });
      }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.dismissModal();
      }
    });

    // Scroll back to top when modal is shown
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  enableFocusMode() {
    // Update settings
    try {
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      settings.focus = true;
      localStorage.setItem('settings', JSON.stringify(settings));

      // Update the state if it exists
      if (typeof state !== 'undefined' && state.settings) {
        state.settings.focus = true;
      }

      // Hide the after-app content
      const afterAppContent = document.getElementById('after-app-placeholder');
      if (afterAppContent) {
        afterAppContent.style.display = 'none';
      }

      // Update the toggle in settings if open
      const focusToggle = document.getElementById('focus');
      if (focusToggle) {
        focusToggle.checked = true;
      }

      // Show success notification
      if (typeof showNotification !== 'undefined') {
        showNotification('Focus Mode enabled! You can now write without distractions. 🎯', false);
      }
    } catch (e) {
      console.error('Error enabling focus mode:', e);
    }
  }

  closeModal() {
    const modal = document.getElementById('focus-mode-suggestion-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  dismissModal() {
    this.dismissedByUser = true;
    localStorage.setItem('scrollDetectorDismissed', Date.now().toString());
    this.closeModal();
  }
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize the scroll detector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollDetector = new ScrollDetector();
  });
} else {
  window.scrollDetector = new ScrollDetector();
}
