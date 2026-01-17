/**
 * CiteCount Footer Loader
 * Automatically loads and injects the footer template into your page
 */

(function() {
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
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }
})();
