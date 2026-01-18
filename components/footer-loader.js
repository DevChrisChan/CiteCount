/**
 * CiteCount Footer Loader
 * Automatically loads and injects the footer template into your page
 */

(function() {
  function updateBreadcrumb() {
    const current = document.getElementById('breadcrumb-current');
    if (!current) {
      return;
    }

    const titleEl = document.querySelector('.article-body h1')
      || document.querySelector('main h1')
      || document.querySelector('section h1')
      || document.querySelector('h1');
    if (titleEl && titleEl.textContent) {
      current.textContent = titleEl.textContent.trim();
    }
  }

  // Function to load the footer
  function loadFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (!footerPlaceholder) {
      console.error('Footer placeholder not found. Make sure you have an element with id="footer-placeholder"');
      return;
    }

    // Fetch the footer template
    fetch('/components/footer-template.html')
      .then(response => {
        if (!response.ok) {
          throw new Error('Footer template not found');
        }
        return response.text();
      })
      .then(html => {
        // Insert the footer HTML
        footerPlaceholder.innerHTML = html;
        
        // Set the current year
        const yearSpan = footerPlaceholder.querySelector('#current-year');
        if (yearSpan) {
          yearSpan.textContent = new Date().getFullYear();
        }
      })
      .catch(error => {
        console.error('Error loading footer:', error);
        footerPlaceholder.innerHTML = '<footer style="padding: 2rem; text-align: center;">Footer could not be loaded.</footer>';
      });
  }

  // Load footer when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateBreadcrumb();
      loadFooter();
    });
  } else {
    updateBreadcrumb();
    loadFooter();
  }
})();
