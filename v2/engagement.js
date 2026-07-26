// Announcement Configuration
// 
// How to use this announcement system:
// 
// 1. Enable/Disable Announcements:
//    Set ANNOUNCEMENT_CONFIG.enabled = true/false
//
// 2. Create a new announcement:
//    Update ANNOUNCEMENT_CONFIG.current with:
//    - id: Unique identifier (change this to show announcement again)
//    - message: The text to display
//    - type: 'info', 'warning', 'success', 'update' (for future styling)
//    - link: Optional { url: 'https://...', text: 'Learn more' }
//    - priority: 'low', 'normal', 'high' (for future features)
//
// 3. Examples:
//    // Simple text announcement
//    updateAnnouncement({
//      id: 'new-feature-2025',
//      message: 'New feature: AI-powered citation detection!',
//      type: 'info',
//      link: null,
//      priority: 'normal'
//    });
//
//    // Announcement with link
//    updateAnnouncement({
//      id: 'maintenance-notice',
//      message: 'Scheduled maintenance on Sunday 2PM-4PM EST.',
//      type: 'warning', 
//      link: { url: '/status', text: 'View details' },
//      priority: 'high'
//    });
//
// 4. Management functions:
//    - enableAnnouncements() - Turn on announcement system
//    - disableAnnouncements() - Turn off announcement system  
//    - clearDismissedAnnouncements() - Force show current announcement again
//    - updateAnnouncement(newConfig) - Update current announcement
//
const ANNOUNCEMENT_CONFIG = {
  enabled: false, // Set to false to disable all announcements
  current: {
    id: 'perplexity-pro-offer-2025-v4', // Unique ID for this announcement
    message: '<b>Are you a Student?</b> Claim 12 months of Perplexity Pro, FREE for all students in ',
    type: 'success',
    link: { url: 'https://pplx.ai/cite', text: 'Claim Now' }, // Optional link object: { url: 'https://...', text: 'Learn more' }
    priority: 'high' // 'low', 'normal', 'high'
  }
};

// Remove following if disabling country-specific messages
// Country detection state
let userCountry = 'your country';

// Function to detect user's country by IP
async function detectUserCountry() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_name) {
      userCountry = data.country_name;
      // Update announcement if it's currently displayed
      const textElement = document.getElementById('announcement-text');
      if (textElement && ANNOUNCEMENT_CONFIG.enabled) {
        updateAnnouncementText();
      }
    }
  } catch (error) {
    console.log('Could not detect country, using default message');
  }
}

// Function to update announcement text with detected country
function updateAnnouncementText() {
  const textElement = document.getElementById('announcement-text');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  
  if (textElement) {
    const messageWithCountry = currentAnnouncement.message + userCountry;
    if (currentAnnouncement.link) {
      textElement.innerHTML = `${messageWithCountry}! <a href="${currentAnnouncement.link.url}" target="_blank" style="text-decoration: underline;">${currentAnnouncement.link.text}</a>`;
    } else {
      textElement.textContent = messageWithCountry;
    }
  }
}
// Ends here for country specific message

function setupAnnouncementBanner() {
  const banner = document.getElementById('announcement-banner');
  if (!banner || !ANNOUNCEMENT_CONFIG.enabled) {
    // If announcements are disabled, ensure banner is hidden
    if (banner) {
      banner.style.display = 'none';
      const header = document.querySelector('header');
      if (header) header.style.top = '0';
      updateStatsMargin();
    }
    return;
  }
  
  const header = document.querySelector('header');
  const textElement = document.getElementById('announcement-text');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  const storedDismissedId = localStorage.getItem('dismissedAnnouncementId');

  // Update the announcement text with country
  updateAnnouncementText();
  
  // Start country detection
  detectUserCountry();

  // Show banner if this announcement hasn't been dismissed
  if (storedDismissedId !== currentAnnouncement.id) {
    banner.style.display = 'flex';
    if (header) header.style.top = `${banner.offsetHeight}px`;
    updateStatsMargin();
  } else {
    banner.style.display = 'none';
    if (header) header.style.top = '0';
    updateStatsMargin();
  }
}

function dismissBanner() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const currentAnnouncement = ANNOUNCEMENT_CONFIG.current;
  
  // Store the dismissed announcement ID
  localStorage.setItem('dismissedAnnouncementId', currentAnnouncement.id);
  
  banner.style.display = 'none';
  if (header) header.style.top = '0';
  updateStatsMargin();
}

// Utility functions for managing announcements
function updateAnnouncement(newAnnouncement) {
  ANNOUNCEMENT_CONFIG.current = newAnnouncement;
  setupAnnouncementBanner();
}

function enableAnnouncements() {
  ANNOUNCEMENT_CONFIG.enabled = true;
  setupAnnouncementBanner();
}

function disableAnnouncements() {
  ANNOUNCEMENT_CONFIG.enabled = false;
  setupAnnouncementBanner();
}

function clearDismissedAnnouncements() {
  localStorage.removeItem('dismissedAnnouncementId');
  setupAnnouncementBanner();
}

// Flag to enable/disable survey messages
const SURVEY_ENABLED = true;

// Survey configuration
const SURVEY_CONFIG = {
  message: "Help us understand our audience better! Are you:",
  options: [
    {
      text: "IB Student",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url&entry.631942244=IB+Student"
    },
    {
      text: "University Student",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url&entry.631942244=University+Student"
    },
    {
      text: "Other",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfSg-AztPu7xyH9kIvLnFdyHTdoX4xR6Z4sRh6RXd90jovCxQ/viewform?usp=pp_url"
    }
  ]
};

let hasInteracted = false;
let alertTimeout;
let currentDonationUrl = '';
let currentButtonText = '';

function hasUserDismissedAlert() {
  const lastDismissed = localStorage.getItem('surveyAlertDismissedTimestamp');
  if (!lastDismissed) return false;
  const hoursSinceDismissal = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
  return hoursSinceDismissal < 24;
}

function markAlertAsDismissed() {
  localStorage.setItem('surveyAlertDismissedTimestamp', Date.now());
}

function showDonationAlert() {
  if (!SURVEY_ENABLED || hasUserDismissedAlert()) return;
  const alert = document.getElementById('donation-alert');
  const messageElement = document.getElementById('donation-message');
  const donateButton = document.getElementById('donate-btn');
  
  // Set the survey message
  messageElement.textContent = SURVEY_CONFIG.message;
  
  // Hide the original donate button
  donateButton.style.display = 'none';
  
  // Create survey option buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginTop = '10px';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.id = 'survey-button-container';
  
  SURVEY_CONFIG.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;
    button.className = 'survey-option-btn';
    button.style.padding = '8px 16px';
    button.style.backgroundColor = 'var(--accent-color)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    button.style.fontWeight = '600';
    button.style.transition = 'all 0.2s ease';
    
    button.addEventListener('mouseover', () => {
      button.style.opacity = '0.9';
      button.style.transform = 'translateY(-1px)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.opacity = '1';
      button.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('click', () => {
      window.open(option.url, '_blank');
      hideDonationAlert();
      localStorage.removeItem('surveyAlertDismissedTimestamp');
    });
    
    buttonContainer.appendChild(button);
  });
  
  // Remove existing button container if it exists
  const existingContainer = alert.querySelector('#survey-button-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Insert button container before the no thanks button
  const noThanksBtn = document.getElementById('no-thanks-btn');
  noThanksBtn.parentNode.insertBefore(buttonContainer, noThanksBtn);
  
  alert.classList.add('show');
}

function hideDonationAlert() {
  const alert = document.getElementById('donation-alert');
  alert.classList.remove('show');
  clearTimeout(alertTimeout);
}

function handleNoThanks() {
  hideDonationAlert();
  markAlertAsDismissed();
}

function handleDonate() {
  // This function is kept for backward compatibility but not used
  hideDonationAlert();
  localStorage.removeItem('surveyAlertDismissedTimestamp');
}

document.addEventListener('DOMContentLoaded', function () {
  hideDonationAlert();
  
  // Setup survey alert on editor click
  const isPremium = localStorage.getItem('isPremium');
  const editor = document.getElementById('editor');
  
  if (editor) {
    editor.addEventListener('click', function () {
      if (!hasInteracted && !hasUserDismissedAlert()) {
        if (isPremium == "true" || !SURVEY_ENABLED) return;
        hasInteracted = true;
        alertTimeout = setTimeout(showDonationAlert, 8000);
      }
    });
  }
});

function dismissPerplexityOverlay() {
  const overlay = document.getElementById('perplexity-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    localStorage.setItem('perplexityOverlayDismissed', 'true');
  }
}

function dismissSidebarAd() {
  const adBox = document.getElementById('sidebar-ad-box');
  if (adBox) {
    adBox.style.display = 'none';
    // Only dismiss for current session, will show again on page reload
  }
}

function claimPerplexityOffer() {
  window.open('https://pplx.ai/cite', '_blank');
  dismissPerplexityOverlay();
}

document.addEventListener('DOMContentLoaded', () => {
      const changingText = document.getElementById('cc-changing-text');
      if (!changingText) {
        return;
      }

      const fallback = document.querySelector('.cc-hero-fallback');
      if (fallback) {
        fallback.style.display = 'none';
      }

      const texts = [
        'Research Papers',
        'IB Courseworks',
        'Academic Essays',
        'Dissertations',
        'University Assignments'
      ];
      const lightGradients = [
        'linear-gradient(90deg, #ef4444, #f97316)',
        'linear-gradient(90deg, #ec4899, #a855f7)',
        'linear-gradient(90deg, #2563eb, #38bdf8)',
        'linear-gradient(90deg, #f59e0b, #f97316)',
        'linear-gradient(90deg, #22c55e, #14b8a6)',
        'linear-gradient(90deg, #db2777, #7c3aed)'
      ];
      const darkGradients = [
        'linear-gradient(90deg, #fda4af, #fed7aa)',
        'linear-gradient(90deg, #fbcfe8, #f0abfc)',
        'linear-gradient(90deg, #93c5fd, #67e8f9)',
        'linear-gradient(90deg, #fde047, #fdba74)',
        'linear-gradient(90deg, #86efac, #5eead4)',
        'linear-gradient(90deg, #f9a8d4, #c4b5fd)'
      ];
      let index = 0;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const getGradients = () => (mediaQuery.matches ? darkGradients : lightGradients);

      changingText.style.backgroundImage = getGradients()[index];

      setInterval(() => {
        index = (index + 1) % texts.length;
        changingText.textContent = texts[index];
        changingText.style.backgroundImage = getGradients()[index];
        changingText.classList.remove('animate');
        void changingText.offsetWidth;
        changingText.classList.add('animate');
      }, 3000);

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', () => {
          changingText.style.backgroundImage = getGradients()[index];
        });
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(() => {
          changingText.style.backgroundImage = getGradients()[index];
        });
      }
    });
