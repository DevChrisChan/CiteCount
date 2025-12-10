// Citation Generator for CiteCount
// Supports APA, Harvard, and MLA citation styles

let currentCitationStyle = 'mla';

/**
 * Open the citation generator modal
 */
function openCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        resetCitationForm();
        // Add escape key listener
        document.addEventListener('keydown', handleCitationModalEscape);
    }
}

/**
 * Close the citation generator modal
 */
function closeCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) {
        modal.style.display = 'none';
        // Remove escape key listener
        document.removeEventListener('keydown', handleCitationModalEscape);
    }
}

/**
 * Handle escape key press to close modal
 */
function handleCitationModalEscape(event) {
    if (event.key === 'Escape') {
        closeCitationModal();
    }
}

/**
 * Reset the citation form
 */
function resetCitationForm() {
    const form = document.getElementById('citation-form');
    if (form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
    }
    
    const output = document.getElementById('citation-output');
    if (output) {
        output.style.display = 'none';
    }
    
    // Hide error message
    hideErrorMessage();
    
    // Reset to website type
    const sourceType = document.getElementById('source-type');
    if (sourceType) {
        sourceType.value = 'website';
        updateCitationForm();
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    const errorDiv = document.getElementById('citation-error');
    const errorText = document.getElementById('citation-error-text');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
    }
}

/**
 * Hide error message
 */
function hideErrorMessage() {
    const errorDiv = document.getElementById('citation-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Select citation style
 */
function selectCitationStyle(style) {
    currentCitationStyle = style;
    
    // Update button states
    const buttons = document.querySelectorAll('.style-btn');
    buttons.forEach(btn => {
        if (btn.dataset.style === style) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Update form fields based on source type
 */
function updateCitationForm() {
    const sourceType = document.getElementById('source-type').value;
    
    // Hide all optional fields first
    document.getElementById('url-group').style.display = 'none';
    document.getElementById('access-date-group').style.display = 'none';
    document.getElementById('journal-group').style.display = 'none';
    document.getElementById('volume-group').style.display = 'none';
    document.getElementById('issue-group').style.display = 'none';
    document.getElementById('pages-group').style.display = 'none';
    document.getElementById('publisher-group').style.display = 'block';
    
    // Show relevant fields based on source type
    switch(sourceType) {
        case 'website':
            document.getElementById('url-group').style.display = 'block';
            document.getElementById('access-date-group').style.display = 'block';
            document.getElementById('publisher-group').style.display = 'none';
            break;
        case 'journal':
            document.getElementById('journal-group').style.display = 'block';
            document.getElementById('volume-group').style.display = 'block';
            document.getElementById('issue-group').style.display = 'block';
            document.getElementById('pages-group').style.display = 'block';
            document.getElementById('publisher-group').style.display = 'none';
            break;
        case 'newspaper':
            document.getElementById('pages-group').style.display = 'block';
            break;
    }
}

/**
 * Generate citation based on selected style and source type
 */
function generateCitation() {
    const sourceType = document.getElementById('source-type').value;
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    
    // Validate required fields
    const missingFields = [];
    if (!author) missingFields.push('Author');
    if (!year) missingFields.push('Year');
    if (!title) missingFields.push('Title');
    
    // Check source-specific required fields
    if (sourceType === 'book') {
        const publisher = document.getElementById('publisher').value.trim();
        if (!publisher) missingFields.push('Publisher');
    } else if (sourceType === 'journal') {
        const journalName = document.getElementById('journal-name').value.trim();
        const volume = document.getElementById('volume').value.trim();
        const pages = document.getElementById('pages').value.trim();
        if (!journalName) missingFields.push('Journal Name');
        if (!volume) missingFields.push('Volume');
        if (!pages) missingFields.push('Pages');
    } else if (sourceType === 'website') {
        const url = document.getElementById('url').value.trim();
        const accessDate = document.getElementById('access-date').value;
        if (!url) missingFields.push('URL');
        if (!accessDate) missingFields.push('Access Date');
    } else if (sourceType === 'newspaper') {
        const publisher = document.getElementById('publisher').value.trim();
        if (!publisher) missingFields.push('Publisher');
    }
    
    if (missingFields.length > 0) {
        showErrorMessage(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return;
    }
    
    // Hide error message if validation passes
    hideErrorMessage();
    
    let inTextCitation = '';
    let bibliographyCitation = '';
    
    switch(currentCitationStyle) {
        case 'apa':
            const apaCitations = generateAPACitation(sourceType);
            inTextCitation = apaCitations.inText;
            bibliographyCitation = apaCitations.bibliography;
            break;
        case 'harvard':
            const harvardCitations = generateHarvardCitation(sourceType);
            inTextCitation = harvardCitations.inText;
            bibliographyCitation = harvardCitations.bibliography;
            break;
        case 'mla':
            const mlaCitations = generateMLACitation(sourceType);
            inTextCitation = mlaCitations.inText;
            bibliographyCitation = mlaCitations.bibliography;
            break;
    }
    
    // Display the citations
    const output = document.getElementById('citation-output');
    const inTextResult = document.getElementById('intext-citation-result');
    const bibliographyResult = document.getElementById('bibliography-citation-result');
    
    if (output && inTextResult && bibliographyResult) {
        inTextResult.innerHTML = inTextCitation;
        bibliographyResult.innerHTML = bibliographyCitation;
        output.style.display = 'block';
        
        // Scroll modal to bottom to reveal the output
        setTimeout(() => {
            const modalBody = document.querySelector('.citation-modal-body');
            if (modalBody) {
                modalBody.scrollTop = modalBody.scrollHeight;
            }
        }, 100);
    }
}

/**
 * Generate APA citation
 */
function generateAPACitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    
    // Extract last name for in-text citation
    const authorLastName = author.split(',')[0].trim();
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${author} (${year}). <i>${title}</i>. ${publisher}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${author} (${year}). ${title}. <i>${journalName}</i>, <i>${volume}</i>${issue ? `(${issue})` : ''}, ${pages}.`;
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${author} (${year}). <i>${title}</i>. Retrieved ${formatDate(accessDate, 'apa')} from ${url}`;
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${author} (${year}). ${title}. <i>${newspaperPublisher}</i>${newspaperPages ? `, ${newspaperPages}` : ''}.`;
            break;
    }
    
    return { inText, bibliography };
}

/**
 * Generate Harvard citation
 */
function generateHarvardCitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    
    // Extract last name for in-text citation
    const authorLastName = author.split(',')[0].trim();
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            inText = `(${authorLastName} ${year})`;
            bibliography = `${author} (${year}) <i>${title}</i>. ${publisher}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName} ${year})`;
            bibliography = `${author} (${year}) '${title}', <i>${journalName}</i>, ${volume}${issue ? `(${issue})` : ''}, pp. ${pages}.`;
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            inText = `(${authorLastName} ${year})`;
            bibliography = `${author} (${year}) <i>${title}</i>. Available at: ${url} (Accessed: ${formatDate(accessDate, 'harvard')}).`;
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName} ${year})`;
            bibliography = `${author} (${year}) '${title}', <i>${newspaperPublisher}</i>${newspaperPages ? `, p. ${newspaperPages}` : ''}.`;
            break;
    }
    
    return { inText, bibliography };
}

/**
 * Generate MLA citation
 */
function generateMLACitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    
    // Extract last name for in-text citation
    const authorLastName = author.split(',')[0].trim();
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            inText = `(${authorLastName})`;
            bibliography = `${author}. <i>${title}</i>. ${publisher}, ${year}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName})`;
            bibliography = `${author}. "${title}." <i>${journalName}</i>, vol. ${volume}${issue ? `, no. ${issue}` : ''}, ${year}, pp. ${pages}.`;
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            inText = `(${authorLastName})`;
            bibliography = `${author}. "${title}." ${year}. <i>Web</i>. ${formatDate(accessDate, 'mla')}. &lt;${url}&gt;.`;
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages').value.trim();
            inText = `(${authorLastName})`;
            bibliography = `${author}. "${title}." <i>${newspaperPublisher}</i>, ${year}${newspaperPages ? `, p. ${newspaperPages}` : ''}.`;
            break;
    }
    
    return { inText, bibliography };
}

/**
 * Format date based on citation style
 */
function formatDate(dateStr, style) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    switch(style) {
        case 'apa':
            return `${month} ${day}, ${year}`;
        case 'harvard':
            return `${day} ${month} ${year}`;
        case 'mla':
            return `${day} ${month.substring(0, 3)}. ${year}`;
        default:
            return `${month} ${day}, ${year}`;
    }
}

/**
 * Copy the generated in-text citation to clipboard
 */
function copyInTextCitation() {
    const citationResult = document.getElementById('intext-citation-result');
    copyCitationHelper(citationResult, 'In-text citation');
}

/**
 * Copy the generated bibliography citation to clipboard
 */
function copyBibliographyCitation() {
    const citationResult = document.getElementById('bibliography-citation-result');
    copyCitationHelper(citationResult, 'Bibliography');
}

/**
 * Helper function to copy citation to clipboard
 */
function copyCitationHelper(element, label) {
    if (!element) return;
    
    // Get the text content (strip HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = element.innerHTML;
    const text = tempDiv.textContent || tempDiv.innerText;
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        if (typeof notify === 'function') {
            notify(`${label} copied to clipboard!`);
        }
    }).catch(err => {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (typeof notify === 'function') {
                notify(`${label} copied to clipboard!`);
            }
        } catch (err) {
            if (typeof notify === 'function') {
                notify(`Failed to copy ${label.toLowerCase()}`);
            }
        }
        document.body.removeChild(textArea);
    });
}

/**
 * Set today's date in the access date field
 */
function setTodayDate() {
    const accessDateInput = document.getElementById('access-date');
    if (accessDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        accessDateInput.value = `${year}-${month}-${day}`;
    }
}

/**
 * Append citation to CiteCount document
 */
function appendToCiteCount() {
    const inTextText = document.getElementById('intext-citation-result')?.textContent;
    const bibliographyText = document.getElementById('bibliography-citation-result')?.textContent;
    
    if (!inTextText || !bibliographyText) {
        if (typeof notify === 'function') {
            notify('No citation to append');
        }
        return;
    }
    
    // Get the editor div (contentEditable)
    const editor = document.getElementById('editor');
    if (!editor) {
        if (typeof notify === 'function') {
            notify('Editor not found');
        }
        return;
    }
    
    // Append both in-text and bibliography citations to the end of the document
    const currentText = editor.innerText || editor.textContent || '';
    const separator = currentText.endsWith('\n') || currentText === '' ? '' : '\n';
    const newText = currentText + separator + inTextText + '\n' + bibliographyText + '\n';
    editor.innerText = newText;
    
    // Trigger update
    if (typeof handleEditorInput === 'function') {
        handleEditorInput();
    }
    
    if (typeof notify === 'function') {
        notify('Citations appended to document');
    }
    
    // Close the modal
    closeCitationModal();
}

/**
 * Fetch title from URL
 * Note: This may not work for all websites due to CORS restrictions
 */
async function fetchTitleFromURL() {
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const fetchStatus = document.getElementById('fetch-status');
    const fetchBtn = document.querySelector('.fetch-btn');
    
    console.log('[Citation] Starting title fetch...');
    
    if (!urlInput || !titleInput) {
        console.error('[Citation] URL or title input not found');
        return;
    }
    
    const url = urlInput.value.trim();
    console.log('[Citation] URL to fetch:', url);
    
    if (!url) {
        showErrorMessage('Please enter a URL first');
        console.warn('[Citation] No URL provided');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
        console.log('[Citation] URL validation passed');
    } catch (e) {
        showErrorMessage('Please enter a valid URL');
        console.error('[Citation] Invalid URL format:', e);
        return;
    }
    
    // Show loading state
    if (fetchBtn) fetchBtn.disabled = true;
    if (fetchStatus) {
        fetchStatus.textContent = 'Fetching title...';
        fetchStatus.style.display = 'block';
        fetchStatus.style.color = 'var(--text-secondary)';
    }
    
    try {
        // Use a CORS proxy following allorigins.win documentation pattern
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        console.log('[Citation] Fetching via proxy:', proxyUrl);
        
        // Add timeout to the fetch request (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('[Citation] Request timeout - aborting');
            controller.abort();
        }, 15000);
        
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log('[Citation] Fetch response status:', response.status);
        console.log('[Citation] Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`Network response was not ok (status: ${response.status})`);
        }
        
        const data = await response.json();
        console.log('[Citation] Data received successfully');
        console.log('[Citation] Data keys:', Object.keys(data));
        
        if (!data.contents) {
            console.error('[Citation] No contents in response:', data);
            throw new Error('No content received from proxy');
        }
        
        const html = data.contents;
        console.log('[Citation] HTML length:', html.length);
        
        // Parse HTML to extract title
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Try multiple methods to get the title
        const title = doc.querySelector('title')?.textContent || 
                     doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                     doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                     doc.querySelector('h1')?.textContent;
        
        console.log('[Citation] Extracted title:', title);
        
        if (title && title.trim()) {
            titleInput.value = title.trim();
            
            // Also set access date to today
            setTodayDate();
            
            if (fetchStatus) {
                fetchStatus.textContent = 'Title fetched successfully!';
                fetchStatus.style.color = '#10b981';
                setTimeout(() => {
                    fetchStatus.style.display = 'none';
                }, 3000);
            }
            hideErrorMessage();
            console.log('[Citation] Title successfully set and access date updated to today');
        } else {
            throw new Error('Could not find title in page');
        }
    } catch (error) {
        console.error('[Citation] Error fetching title:', error);
        console.error('[Citation] Error name:', error.name);
        console.error('[Citation] Error message:', error.message);
        
        let errorMessage = 'Could not fetch title automatically. ';
        
        if (error.name === 'AbortError') {
            errorMessage += 'Request timed out (15s limit). The website may be very slow or blocked. Please enter the title manually.';
        } else if (error.message.includes('408') || error.message.includes('429')) {
            errorMessage += 'The proxy service is busy or rate-limited. Please wait a moment and try again, or enter the title manually.';
        } else if (error.message.includes('Network response was not ok')) {
            errorMessage += 'The proxy service returned an error. This can happen with certain websites. Please enter the title manually.';
        } else {
            errorMessage += 'Due to browser security (CORS) and website restrictions, automatic title fetching may not work for all websites. Please enter the title manually.';
        }
        
        if (fetchStatus) {
            fetchStatus.textContent = errorMessage;
            fetchStatus.style.color = '#ef4444';
        }
        
        console.log('[Citation] Suggested action: Enter title manually');
    } finally {
        if (fetchBtn) fetchBtn.disabled = false;
        console.log('[Citation] Fetch attempt complete');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('citation-modal');
    if (modal && event.target === modal) {
        closeCitationModal();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCitationForm();
});
