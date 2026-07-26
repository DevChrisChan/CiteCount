if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service.js')
      .then(registration => {
        registration.update();
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('A new version of CiteCount is available. Refresh to update.');
            }
          });
        });
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
    });
}

window.onerror = function (message, source, lineno, colno, error) {
  console.error('window.onerror triggered');
  console.error('Message:', message);
  console.error('Source:', source);
  console.error('Line:', lineno, 'Column:', colno);
  console.error('Error object:', error);
  
  const errorMessage = `Error: ${message}\n` +
    `Source: ${source}\n` +
    `Line: ${lineno}\n` +
    `Column: ${colno}\n` +
    `Stack: ${error ? error.stack : 'N/A'}`;
  
  console.log('Calling showErrorModal...');
  showErrorModal(errorMessage);
  
  // Return true to prevent default browser error handling
  return true;
};

// Error Modal Functions
let currentErrorDetails = '';

function showErrorModal(errorDetails) {
  console.log('showErrorModal called with:', errorDetails);
  currentErrorDetails = errorDetails;
  
  // Function to actually show the modal
  const displayModal = () => {
    const modal = document.getElementById('error-modal');
    const errorBox = document.getElementById('error-details-box');
   
    if (modal && errorBox) {
      errorBox.textContent = errorDetails;
      modal.style.display = 'block';
      
      // Reset copy button text
      const copyText = document.getElementById('copy-error-text');
      if (copyText) copyText.textContent = 'Copy';
    } else {
      console.error('Error modal elements not found. Modal:', modal, 'ErrorBox:', errorBox);
      // Fallback to notify if modal isn't available
      if (typeof notify === 'function') {
        notify('An error occurred. Check console for details.');
      }
    }
  };
  
  // If DOM is ready, show immediately. Otherwise, wait for DOMContentLoaded
  if (document.getElementById('error-modal')) {
    displayModal();
  } else {
    console.log('Modal not ready yet, waiting for DOM...');
    // Wait a bit for modals.js to inject the HTML
    setTimeout(() => {
      if (document.getElementById('error-modal')) {
        displayModal();
      } else {
        // Still not available, try one more time after a longer delay
        setTimeout(displayModal, 500);
      }
    }, 100);
  }
}

function closeErrorModal() {
  const modal = document.getElementById('error-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function copyErrorDetails() {
  navigator.clipboard.writeText(currentErrorDetails).then(() => {
    const copyText = document.getElementById('copy-error-text');
    if (copyText) {
      copyText.textContent = 'Copied!';
      setTimeout(() => {
        copyText.textContent = 'Copy';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy error details:', err);
  });
}

function contactSupportFromError() {
  // Open support page in new tab/window
  window.open('/contact.html', '_blank');
  
  // Close the error modal
  closeErrorModal();
}

// Cookie Consent Management
class CookieConsent {
  constructor() {
    this.STORAGE_KEY = 'cookieConsent';
    this.banner = document.getElementById('cookie-consent-banner');
    this.settingsModal = document.getElementById('cookie-settings-modal');
    this.init();
  }

  init() {
    // Check if user has already made a choice
    const consent = this.getConsent();
    if (!consent) {
      this.showBanner();
    } else {
      this.applyConsent(consent);
    }

    this.bindEvents();
  }

  bindEvents() {
    // Banner buttons
    document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
      this.acceptAll();
    });

    document.getElementById('cookie-reject')?.addEventListener('click', () => {
      this.rejectNonEssential();
    });

    document.getElementById('cookie-settings')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Settings modal buttons
    document.getElementById('close-cookie-settings')?.addEventListener('click', () => {
      this.hideSettings();
    });

    document.getElementById('save-cookie-preferences')?.addEventListener('click', () => {
      this.savePreferences();
    });

    document.getElementById('accept-all-settings')?.addEventListener('click', () => {
      this.acceptAllFromSettings();
    });

    // Close modal when clicking outside
    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hideSettings();
      }
    });
  }

  showBanner() {
    if (this.banner) {
      this.banner.style.display = 'block';
    }
  }

  hideBanner() {
    if (this.banner) {
      this.banner.style.display = 'none';
    }
  }

  showSettings() {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'flex';
      this.loadCurrentPreferences();
    }
  }

  hideSettings() {
    if (this.settingsModal) {
      this.settingsModal.style.display = 'none';
    }
  }

  loadCurrentPreferences() {
    const consent = this.getConsent();
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const advertisingCheckbox = document.getElementById('advertising-cookies');

    if (consent) {
      if (analyticsCheckbox) analyticsCheckbox.checked = consent.analytics;
      if (advertisingCheckbox) advertisingCheckbox.checked = consent.advertising;
    } else {
      // Default to checked if no preference set
      if (analyticsCheckbox) analyticsCheckbox.checked = true;
      if (advertisingCheckbox) advertisingCheckbox.checked = true;
    }
  }

  acceptAll() {
    const consent = {
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: Date.now()
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  rejectNonEssential() {
    const consent = {
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: Date.now()
    };
    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
  }

  savePreferences() {
    const analyticsCheckbox = document.getElementById('analytics-cookies');
    const advertisingCheckbox = document.getElementById('advertising-cookies');

    const consent = {
      essential: true,
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      advertising: advertisingCheckbox ? advertisingCheckbox.checked : false,
      timestamp: Date.now()
    };

    this.saveConsent(consent);
    this.applyConsent(consent);
    this.hideBanner();
    this.hideSettings();
  }

  acceptAllFromSettings() {
    document.getElementById('analytics-cookies').checked = true;
    document.getElementById('advertising-cookies').checked = true;
    this.savePreferences();
  }

  saveConsent(consent) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
  }

  getConsent() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  applyConsent(consent) {
    // Handle analytics
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Handle advertising
    if (consent.advertising) {
      this.enableAdvertising();
    } else {
      this.disableAdvertising();
    }
  }

  enableAnalytics() {
    // Enable Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }

    // Enable other analytics if needed
    console.log('Analytics enabled');
  }

  disableAnalytics() {
    // Disable Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        analytics_storage: 'denied'
      });
    }

    console.log('Analytics disabled');
  }

  enableAdvertising() {
    // Enable advertising cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    }

    console.log('Advertising enabled');
  }

  disableAdvertising() {
    // Disable advertising cookies
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }

    console.log('Advertising disabled');
  }

  // Method to check if a specific consent type is granted
  hasConsent(type) {
    const consent = this.getConsent();
    return consent ? consent[type] : false;
  }

  // Method to revoke consent (for testing or user request)
  revokeConsent() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.showBanner();
  }
}

// Initialize cookie consent when DOM is loaded
// TEMPORARILY COMMENTED OUT
// document.addEventListener('DOMContentLoaded', function() {
//  window.cookieConsent = new CookieConsent();
// });
