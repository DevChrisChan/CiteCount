/**
 * CiteCount Interactive Guide
 * A custom-built interactive guide system for CiteCount
 * Similar to intro.js but tailored for our specific needs
 */

class CiteCountGuide {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.steps = [];
    this.overlay = null;
    this.tooltip = null;
    this.highlightBox = null;
    this.onComplete = null;
    this.onSkip = null;
    
    // Bind methods
    this.nextStep = this.nextStep.bind(this);
    this.prevStep = this.prevStep.bind(this);
    this.skip = this.skip.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  /**
   * Initialize the guide with steps
   * @param {Array} steps - Array of step objects
   * @param {Object} options - Configuration options
   */
  start(steps, options = {}) {
    if (this.isActive) {
      this.end();
    }

    this.steps = steps;
    this.currentStep = 0;
    this.isActive = true;
    this.onComplete = options.onComplete || null;
    this.onSkip = options.onSkip || null;

    // Create guide elements
    this.createOverlay();
    this.createTooltip();
    this.createHighlightBox();

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('resize', () => this.updatePositions());

    // Show first step
    this.showStep(this.currentStep);

    // Track analytics
    if (window.lta && typeof window.lta === 'function') {
      window.lta('event', 'interactive-guide-start');
    }
  }

  /**
   * Create the overlay element
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cc-guide-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-label', 'Interactive guide');
    document.body.appendChild(this.overlay);
  }

  /**
   * Create the tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'cc-guide-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    
    // Set initial centered position to prevent jump
    this.tooltip.style.top = '50%';
    this.tooltip.style.left = '50%';
    this.tooltip.style.transform = 'translate(-50%, -50%)';
    this.tooltip.style.opacity = '0';
    
    this.tooltip.innerHTML = `
      <div class="cc-guide-tooltip-header">
        <div class="cc-guide-progress">
          <span class="cc-guide-progress-text">Step <span class="cc-guide-current-step">1</span> of <span class="cc-guide-total-steps">${this.steps.length}</span></span>
          <div class="cc-guide-progress-bar">
            <div class="cc-guide-progress-fill" style="width: 0%"></div>
          </div>
        </div>
        <button class="cc-guide-close" aria-label="Close guide" title="Close guide">✕</button>
      </div>
      <div class="cc-guide-tooltip-body">
        <h3 class="cc-guide-tooltip-title"></h3>
        <p class="cc-guide-tooltip-content"></p>
      </div>
      <div class="cc-guide-tooltip-footer">
        <button class="cc-guide-btn cc-guide-btn-secondary cc-guide-skip">Skip Tour</button>
        <div class="cc-guide-navigation">
          <button class="cc-guide-btn cc-guide-btn-secondary cc-guide-prev" style="display: none;">Previous</button>
          <button class="cc-guide-btn cc-guide-btn-primary cc-guide-next">Next</button>
        </div>
      </div>
      <div class="cc-guide-arrow"></div>
    `;

    // Add event listeners
    this.tooltip.querySelector('.cc-guide-next').addEventListener('click', this.nextStep);
    this.tooltip.querySelector('.cc-guide-prev').addEventListener('click', this.prevStep);
    this.tooltip.querySelector('.cc-guide-skip').addEventListener('click', this.skip);
    this.tooltip.querySelector('.cc-guide-close').addEventListener('click', this.skip);

    document.body.appendChild(this.tooltip);
    
    // Fade in after appending
    requestAnimationFrame(() => {
      this.tooltip.style.opacity = '1';
    });
  }

  /**
   * Create the highlight box element
   */
  createHighlightBox() {
    this.highlightBox = document.createElement('div');
    this.highlightBox.className = 'cc-guide-highlight';
    document.body.appendChild(this.highlightBox);
  }

  /**
   * Show a specific step
   * @param {number} stepIndex - Index of the step to show
   */
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return;
    }

    this.currentStep = stepIndex;
    const step = this.steps[stepIndex];

    // Update progress
    const progress = ((stepIndex + 1) / this.steps.length) * 100;
    this.tooltip.querySelector('.cc-guide-current-step').textContent = stepIndex + 1;
    this.tooltip.querySelector('.cc-guide-progress-fill').style.width = `${progress}%`;

    // Update tooltip content
    this.tooltip.querySelector('.cc-guide-tooltip-title').textContent = step.title;
    this.tooltip.querySelector('.cc-guide-tooltip-content').innerHTML = step.content;

    // Update navigation buttons
    const prevBtn = this.tooltip.querySelector('.cc-guide-prev');
    const nextBtn = this.tooltip.querySelector('.cc-guide-next');
    
    prevBtn.style.display = stepIndex > 0 ? 'block' : 'none';
    nextBtn.textContent = stepIndex === this.steps.length - 1 ? 'Finish' : 'Next';

    // Highlight element
    if (step.element) {
      this.highlightElement(step.element);
      this.positionTooltip(step.element, step.position || 'bottom');
    } else {
      // Center tooltip if no element specified
      this.highlightBox.style.display = 'none';
      // Show overlay background for center steps
      if (this.overlay) {
        this.overlay.classList.add('cc-guide-overlay-visible');
      }
      this.centerTooltip();
    }

    // Execute step callback if provided
    if (step.onShow && typeof step.onShow === 'function') {
      step.onShow();
    }

    // Scroll element into view if needed (unless onShow handles it)
    if (step.element && !step.onShow) {
      const element = typeof step.element === 'string' 
        ? document.querySelector(step.element) 
        : step.element;
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Highlight an element
   * @param {string|HTMLElement} elementSelector - Element or selector to highlight
   */
  highlightElement(elementSelector) {
    const element = typeof elementSelector === 'string' 
      ? document.querySelector(elementSelector) 
      : elementSelector;

    if (!element) {
      this.highlightBox.style.display = 'none';
      // Show overlay background when no element is highlighted
      if (this.overlay) {
        this.overlay.classList.add('cc-guide-overlay-visible');
      }
      return;
    }

    // Hide overlay background when element is highlighted
    if (this.overlay) {
      this.overlay.classList.remove('cc-guide-overlay-visible');
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    this.highlightBox.style.display = 'block';
    this.highlightBox.style.top = `${rect.top + window.scrollY - padding}px`;
    this.highlightBox.style.left = `${rect.left + window.scrollX - padding}px`;
    this.highlightBox.style.width = `${rect.width + padding * 2}px`;
    this.highlightBox.style.height = `${rect.height + padding * 2}px`;

    // Add pulsing animation
    this.highlightBox.classList.remove('cc-guide-pulse');
    void this.highlightBox.offsetWidth; // Trigger reflow
    this.highlightBox.classList.add('cc-guide-pulse');
  }

  /**
   * Position tooltip relative to an element
   * @param {string|HTMLElement} elementSelector - Element or selector
   * @param {string} position - Position: 'top', 'bottom', 'left', 'right'
   */
  positionTooltip(elementSelector, position = 'bottom') {
    const element = typeof elementSelector === 'string' 
      ? document.querySelector(elementSelector) 
      : elementSelector;

    if (!element) {
      this.centerTooltip();
      return;
    }

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const arrow = this.tooltip.querySelector('.cc-guide-arrow');
    const spacing = 20;
    
    let top, left;
    let arrowPosition = '';

    // Reset arrow classes
    arrow.className = 'cc-guide-arrow';

    switch (position) {
      case 'top':
        top = rect.top + window.scrollY - tooltipRect.height - spacing;
        left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        arrow.classList.add('cc-guide-arrow-bottom');
        arrowPosition = 'bottom';
        break;

      case 'bottom':
        top = rect.bottom + window.scrollY + spacing;
        left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        arrow.classList.add('cc-guide-arrow-top');
        arrowPosition = 'top';
        break;

      case 'left':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left + window.scrollX - tooltipRect.width - spacing;
        arrow.classList.add('cc-guide-arrow-right');
        arrowPosition = 'right';
        break;

      case 'right':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + window.scrollX + spacing;
        arrow.classList.add('cc-guide-arrow-left');
        arrowPosition = 'left';
        break;

      default:
        this.centerTooltip();
        return;
    }

    // Ensure tooltip stays within viewport
    const maxLeft = window.innerWidth - tooltipRect.width - 20;
    const maxTop = window.innerHeight + window.scrollY - tooltipRect.height - 20;
    
    left = Math.max(20, Math.min(left, maxLeft));
    top = Math.max(20, Math.min(top, maxTop));

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.transform = 'none';
  }

  /**
   * Center the tooltip on the screen
   */
  centerTooltip() {
    this.tooltip.style.top = '50%';
    this.tooltip.style.left = '50%';
    this.tooltip.style.transform = 'translate(-50%, -50%)';
    
    const arrow = this.tooltip.querySelector('.cc-guide-arrow');
    arrow.className = 'cc-guide-arrow';
  }

  /**
   * Update positions on resize
   */
  updatePositions() {
    if (!this.isActive || this.currentStep >= this.steps.length) {
      return;
    }

    const step = this.steps[this.currentStep];
    if (step.element) {
      this.highlightElement(step.element);
      this.positionTooltip(step.element, step.position || 'bottom');
    } else {
      this.centerTooltip();
    }
  }

  /**
   * Go to next step
   */
  nextStep() {
    // If moving from step 0 (welcome) to step 1 (text editor), insert example text
    if (this.currentStep === 0) {
      this.insertExampleText();
    }
    
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.complete();
    }
  }

  /**
   * Go to previous step
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * Skip the tour
   */
  skip() {
    if (this.onSkip && typeof this.onSkip === 'function') {
      this.onSkip(this.currentStep);
    }

    if (window.lta && typeof window.lta === 'function') {
      window.lta('event', 'interactive-guide-skip', { step: this.currentStep });
    }

    this.end();
  }

  /**
   * Complete the tour
   */
  complete() {
    // Clear example text from editor
    const editor = document.getElementById('editor');
    const welcomeText = document.getElementById('welcome-text');
    if (editor) {
      editor.innerText = '';
      if (welcomeText) {
        welcomeText.style.display = 'block';
      }
      if (typeof handleEditorInput === 'function') {
        handleEditorInput();
      }
    }
    
    if (this.onComplete && typeof this.onComplete === 'function') {
      this.onComplete();
    }

    if (window.lta && typeof window.lta === 'function') {
      window.lta('event', 'interactive-guide-complete');
    }

    this.end();
  }

  /**
   * End the tour and cleanup
   */
  end() {
    this.isActive = false;
    this.currentStep = 0;

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyPress);

    // Remove elements with fade out
    if (this.overlay) {
      this.overlay.classList.add('cc-guide-fade-out');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }, 300);
    }

    if (this.tooltip) {
      this.tooltip.classList.add('cc-guide-fade-out');
      setTimeout(() => {
        if (this.tooltip && this.tooltip.parentNode) {
          this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltip = null;
      }, 300);
    }

    if (this.highlightBox) {
      this.highlightBox.classList.add('cc-guide-fade-out');
      setTimeout(() => {
        if (this.highlightBox && this.highlightBox.parentNode) {
          this.highlightBox.parentNode.removeChild(this.highlightBox);
        }
        this.highlightBox = null;
      }, 300);
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyPress(event) {
    if (!this.isActive) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'Enter':
        event.preventDefault();
        this.nextStep();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.prevStep();
        break;

      case 'Escape':
        event.preventDefault();
        this.skip();
        break;
    }
  }
  
  /**
   * Insert example text into the editor
   */
  insertExampleText() {
    const editor = document.getElementById('editor');
    const welcomeText = document.getElementById('welcome-text');
    if (editor) {
      editor.innerText = `Welcome to CiteCount! CiteCount is a tool designed to help you count words in your text while excluding in-text citations.\n\nCiteCount automatically detects your in-text citation and highlights it (CiteCount, 2025).\n\nBy default, all citations are not included in the Total Words count. They are visualized by a red highlight in the text. If CiteCount misrecognized an in-text citation (since CiteCount detects citations in parenthesis, like this one), you can always toggle it to count into the total word count, and it will be done for all occurrences of the same text.\n\nYou can click on a citation and CiteCount will jump to its position ("What's new in CiteCount v2", 2025).\n\nClick the help icon in the navigation bar if you run into any issues.\n\nThanks for using CiteCount!`;
      if (welcomeText) {
        welcomeText.style.display = 'none';
      }
      // Demo exception: keep this sample citation excluded by default for the example
      if (typeof state !== 'undefined' && state.includedCitations) {
        state.includedCitations.set("since CiteCount detects citations in parenthesis, like this one", false);
        if (typeof saveCitationStates === 'function') {
          saveCitationStates();
        }
      }
      if (typeof handleEditorInput === 'function') {
        handleEditorInput();
      }
    }
  }
}

// Guide steps definition
const citeCountGuideSteps = [
  {
    title: "Welcome to CiteCount! 👋",
    content: "Let's take a quick tour of CiteCount's main features. We'll start with an example to show you how it works. You can skip this tour at any time by pressing ESC or clicking 'Skip Tour'.",
    element: null,
    position: 'center'
  },
  {
    title: "Text Editor",
    content: "This is where you type or paste your document. You can also drag and drop Word or PDF files directly here. CiteCount processes everything locally in your browser for maximum privacy.",
    element: '#editor',
    position: 'right',
    onShow: () => {
      // Don't auto-scroll for this step since we just loaded content
    }
  },
  {
    title: "Word Count Display",
    content: "These counters show your statistics in real-time. The most important one is 'Words without Citations' - this is the count most assignments require, excluding all citations and references.",
    element: '.stats-row',
    position: 'bottom'
  },
  {
    title: "Document Management",
    content: "Save multiple documents and switch between them easily. Your documents are stored locally in your browser and never sent to any server.",
    element: '#file-sidebar',
    position: 'right'
  },
  {
    title: "Citations Panel",
    content: "View all detected citations here. Each citation shows how many words it contains and how many times it appears in your document. If CiteCount incorrectly detects something as a citation, you can exclude it using the toggle in the 'Exclude Citation' column.",
    element: '#citations-panel',
    position: 'left',
    onShow: () => {
      // Don't auto-scroll for this step
    }
  },
  {
    title: "More Tools",
    content: "Access additional productivity tools like Dictionary, Thesaurus, Pomodoro Timer, Translation, and more. Click the menu button to explore all available tools.",
    element: '#details-menu-btn',
    position: 'top',
    onShow: () => {
      // Scroll to top to ensure the element is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Settings",
    content: "Customize CiteCount to your preferences. Change the theme, adjust citation detection patterns, configure export options, and more.",
    element: '#settings-btn',
    position: 'bottom'
  },
  {
    title: "You're All Set! 🎉",
    content: "You now know the basics of CiteCount! Start by typing or pasting your document, and CiteCount will automatically count words and detect citations. Need help anytime? Click the Help button in the header.<br><br>You can always revisit this tour from <strong>Settings → About</strong>.",
    element: null,
    position: 'center'
  }
];

// Initialize guide singleton
let citeCountGuide = null;

/**
 * Start the interactive guide
 */
function startCiteCountGuide() {
  if (!citeCountGuide) {
    citeCountGuide = new CiteCountGuide();
  }

  citeCountGuide.start(citeCountGuideSteps, {
    onComplete: () => {
      // Set a flag in localStorage so we don't show the guide automatically again
      try {
        localStorage.setItem('cc-guide-completed', 'true');
      } catch (e) {
        console.warn('Could not save guide completion status:', e);
      }
    },
    onSkip: (step) => {
      console.log('Guide skipped at step:', step);
    }
  });
}

// Show welcome banner for first-time users
document.addEventListener('DOMContentLoaded', () => {
  // Check if user has completed the guide before
  try {
    const hasCompletedGuide = localStorage.getItem('cc-guide-completed');
    
    // Only show welcome banner if they haven't completed the guide
    if (!hasCompletedGuide) {
      const welcomeBanner = document.getElementById('first-time-welcome');
      if (welcomeBanner) {
        welcomeBanner.style.display = 'block';
      }
    }
  } catch (e) {
    console.warn('Could not check guide status:', e);
  }
});

// Make functions globally available
window.startCiteCountGuide = startCiteCountGuide;
window.CiteCountGuide = CiteCountGuide;
