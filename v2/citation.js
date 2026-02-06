// Citation Generator for CiteCount
// Supports APA 7th, Harvard, and MLA 9th citation styles
// Features: Auto-lookup from DOI, ISBN, and URLs

let currentCitationStyle = localStorage.getItem('defaultCitationStyle') || 'mla';
let currentLookupType = 'url';
let isLookupInProgress = false;

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Check if the citation form has any content
 * Note: Ignores the auto-filled access date to avoid false positives
 */
function hasCitationFormContent() {
    const form = document.getElementById('citation-form');
    if (!form) return false;
    
    const inputs = form.querySelectorAll('input[type="text"], input[type="date"]');
    for (const input of inputs) {
        // Skip the access-date field as it's auto-filled
        if (input.id === 'access-date') {
            continue;
        }
        if (input.value.trim()) {
            return true;
        }
    }
    return false;
}

/**
 * Open the citation generator modal
 */
function openCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        resetCitationForm();
        // Set today's date as default
        setTodayDate();
        // Add keyboard support for Escape key
        setupCitationModalKeyboard();
        // Set the saved citation style
        selectCitationStyle(currentCitationStyle);
    }
}

/**
 * Close the citation generator modal
 */
function closeCitationModal(force = false) {
    const modal = document.getElementById('citation-modal');
    if (!modal) return;
    
    // Check if there's content and we're not forcing close
    if (!force && hasCitationFormContent()) {
        showUnsavedContentModal(() => {
            // Callback when user confirms discard - actually close the modal now
            const citationModal = document.getElementById('citation-modal');
            if (citationModal) {
                citationModal.style.display = 'none';
            }
            // Remove keyboard listener
            if (window.citationModalKeyHandler) {
                document.removeEventListener('keydown', window.citationModalKeyHandler);
                window.citationModalKeyHandler = null;
            }
        });
        return;
    }
    
    modal.style.display = 'none';
    // Remove keyboard listener
    if (window.citationModalKeyHandler) {
        document.removeEventListener('keydown', window.citationModalKeyHandler);
        window.citationModalKeyHandler = null;
    }
}

/**
 * Open the citation result modal
 */
function openCitationResultModal() {
    const modal = document.getElementById('citation-result-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close the citation result modal
 */
function closeCitationResultModal() {
    const modal = document.getElementById('citation-result-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Setup keyboard support for citation modal
 */
function setupCitationModalKeyboard() {
    // Remove existing listener if any
    if (window.citationModalKeyHandler) {
        document.removeEventListener('keydown', window.citationModalKeyHandler);
    }
    
    window.citationModalKeyHandler = (e) => {
        const modal = document.getElementById('citation-modal');
        if (!modal || modal.style.display === 'none') return;
        
        if (e.key === 'Escape') {
            e.preventDefault();
            closeCitationModal();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            // Ctrl/⌘ + Enter to generate citation
            e.preventDefault();
            generateCitation();
        }
    };
    
    document.addEventListener('keydown', window.citationModalKeyHandler);
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
    
    // Reset auto-lookup input
    const lookupInput = document.getElementById('auto-lookup-input');
    if (lookupInput) lookupInput.value = '';
    
    // Hide messages
    hideErrorMessage();
    hideSuccessMessage();
    hideLookupStatus();
    
    // Reset to website type
    const sourceType = document.getElementById('source-type');
    if (sourceType) {
        sourceType.value = 'website';
        updateCitationForm();
    }
}

// ============================================
// MESSAGE DISPLAY
// ============================================

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
    
    hideSuccessMessage();
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
 * Show success message
 */
function showSuccessMessage(message) {
    const successDiv = document.getElementById('citation-success');
    const successText = document.getElementById('citation-success-text');
    
    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideSuccessMessage();
        }, 5000);
    }
    
    hideErrorMessage();
}

/**
 * Hide success message
 */
function hideSuccessMessage() {
    const successDiv = document.getElementById('citation-success');
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

/**
 * Show lookup status
 */
function showLookupStatus(message, isError = false) {
    const statusEl = document.getElementById('lookup-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        statusEl.style.color = isError ? '#ef4444' : '#10b981';
    }
}

/**
 * Hide lookup status
 */
function hideLookupStatus() {
    const statusEl = document.getElementById('lookup-status');
    if (statusEl) {
        statusEl.style.display = 'none';
    }
}

// ============================================
// LOOKUP TYPE & STYLE SELECTION
// ============================================

/**
 * Select lookup type (URL, DOI, ISBN)
 */
function selectLookupType(type) {
    currentLookupType = type;
    
    // Update button states
    const buttons = document.querySelectorAll('.lookup-type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update placeholder
    const input = document.getElementById('auto-lookup-input');
    if (input) {
        const placeholders = {
            'url': 'Enter URL (e.g., https://example.com/article)',
            'doi': 'Enter DOI (e.g., 10.1000/xyz123)',
            'isbn': 'Enter ISBN (e.g., 978-0-123456-78-9)'
        };
        input.placeholder = placeholders[type] || 'Enter identifier';
    }
}

/**
 * Select citation style
 */
function selectCitationStyle(style) {
    currentCitationStyle = style;
    
    // Save to localStorage for persistence
    localStorage.setItem('defaultCitationStyle', style);
    
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
    const fieldsToHide = [
        'url-group', 'access-date-group', 'journal-group', 'volume-group',
        'issue-group', 'pages-group', 'publisher-group', 'publisher-location-group',
        'edition-group', 'isbn-group', 'doi-group', 'website-name-group'
    ];
    
    fieldsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Show relevant fields based on source type
    switch(sourceType) {
        case 'website':
            showField('url-group');
            showField('access-date-group');
            showField('website-name-group');
            break;
        case 'book':
            showField('publisher-group');
            showField('publisher-location-group');
            showField('edition-group');
            showField('isbn-group');
            break;
        case 'journal':
            showField('journal-group');
            showField('volume-group');
            showField('issue-group');
            showField('pages-group');
            showField('doi-group');
            break;
        case 'newspaper':
            showField('publisher-group');
            showField('pages-group');
            showField('url-group');
            showField('access-date-group');
            break;
    }
}

function showField(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

// ============================================
// AUTO-LOOKUP FUNCTIONALITY
// ============================================

/**
 * Main auto-lookup function
 */
async function autoLookup() {
    if (isLookupInProgress) return;
    
    const input = document.getElementById('auto-lookup-input');
    const value = input?.value?.trim();
    
    if (!value) {
        showErrorMessage('Please enter a URL, DOI, or ISBN to lookup');
        return;
    }
    
    // Validate URL if it looks like a URL
    if (currentLookupType === 'url' || (value.startsWith('http') || value.includes('.'))) {
        // Ensure URL has protocol
        let urlToValidate = value;
        if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
            urlToValidate = 'https://' + urlToValidate;
        }
        
        try {
            new URL(urlToValidate);
        } catch (e) {
            showErrorMessage('Please enter a valid URL (e.g., https://example.com or example.com)');
            return;
        }
    }
    
    // Auto-detect type if needed
    const detectedType = detectIdentifierType(value);
    if (detectedType && detectedType !== currentLookupType) {
        selectLookupType(detectedType);
    }
    
    setLookupLoading(true);
    hideLookupStatus();
    hideErrorMessage();
    
    try {
        let result;
        
        switch(currentLookupType) {
            case 'doi':
                result = await lookupDOI(value);
                break;
            case 'isbn':
                result = await lookupISBN(value);
                break;
            case 'url':
            default:
                result = await lookupURL(value);
                break;
        }
        
        if (result) {
            fillFormWithData(result);
            showSuccessMessage('Citation data auto-filled successfully!');
        }
    } catch (error) {
        console.error('[Citation] Lookup error:', error);
        showErrorMessage(error.message || 'Failed to lookup. Please enter details manually.');
    } finally {
        setLookupLoading(false);
    }
}

/**
 * Detect identifier type from input
 */
function detectIdentifierType(value) {
    // DOI pattern: 10.xxxx/xxxxx
    if (/^10\.\d{4,}/.test(value) || value.includes('doi.org')) {
        return 'doi';
    }
    
    // ISBN pattern: 10 or 13 digits (with or without dashes)
    const cleanedISBN = value.replace(/[-\s]/g, '');
    if (/^(97[89])?\d{9}[\dXx]$/.test(cleanedISBN)) {
        return 'isbn';
    }
    
    // URL pattern
    if (value.startsWith('http://') || value.startsWith('https://') || value.includes('.')) {
        return 'url';
    }
    
    return null;
}

/**
 * Set loading state for lookup button
 */
function setLookupLoading(loading) {
    isLookupInProgress = loading;
    const btn = document.getElementById('auto-lookup-btn');
    const lookupIcon = btn?.querySelector('.lookup-icon');
    const loadingIcon = btn?.querySelector('.loading-icon');
    
    if (btn) {
        btn.disabled = loading;
        if (loading) {
            btn.classList.add('loading');
            if (lookupIcon) lookupIcon.style.display = 'none';
            if (loadingIcon) loadingIcon.style.display = 'block';
        } else {
            btn.classList.remove('loading');
            if (lookupIcon) lookupIcon.style.display = 'block';
            if (loadingIcon) loadingIcon.style.display = 'none';
        }
    }
}

/**
 * Lookup DOI using CrossRef API
 */
async function lookupDOI(doi) {
    // Clean DOI
    let cleanDOI = doi.trim();
    if (cleanDOI.includes('doi.org/')) {
        cleanDOI = cleanDOI.split('doi.org/')[1];
    }
    if (cleanDOI.startsWith('doi:')) {
        cleanDOI = cleanDOI.substring(4);
    }
    
    console.log('[Citation] Looking up DOI:', cleanDOI);
    
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('DOI not found. Please check the DOI and try again.');
    }
    
    const data = await response.json();
    const work = data.message;
    
    // Parse authors
    let authors = '';
    if (work.author && work.author.length > 0) {
        authors = work.author.map(a => {
            if (a.family && a.given) {
                return `${a.family}, ${a.given}`;
            }
            return a.name || '';
        }).filter(a => a).join('; ');
    }
    
    // Get year from published date
    let year = '';
    if (work.published && work.published['date-parts'] && work.published['date-parts'][0]) {
        year = work.published['date-parts'][0][0]?.toString() || '';
    } else if (work['published-print'] && work['published-print']['date-parts']) {
        year = work['published-print']['date-parts'][0][0]?.toString() || '';
    } else if (work.created && work.created['date-parts']) {
        year = work.created['date-parts'][0][0]?.toString() || '';
    }
    
    // Determine type
    let sourceType = 'journal';
    if (work.type === 'book' || work.type === 'book-chapter') {
        sourceType = 'book';
    }
    
    return {
        sourceType: sourceType,
        title: work.title?.[0] || '',
        author: authors,
        year: year,
        journalName: work['container-title']?.[0] || '',
        volume: work.volume || '',
        issue: work.issue || '',
        pages: work.page || '',
        doi: cleanDOI,
        publisher: work.publisher || '',
        url: work.URL || `https://doi.org/${cleanDOI}`
    };
}

/**
 * Lookup ISBN using Open Library API
 */
async function lookupISBN(isbn) {
    // Clean ISBN (remove dashes and spaces)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    console.log('[Citation] Looking up ISBN:', cleanISBN);
    
    // Try Open Library API
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`);
    
    if (!response.ok) {
        throw new Error('Failed to connect to book database.');
    }
    
    const data = await response.json();
    const bookKey = `ISBN:${cleanISBN}`;
    const book = data[bookKey];
    
    if (!book) {
        // Try alternative: Google Books API
        return await lookupISBNGoogleBooks(cleanISBN);
    }
    
    // Parse authors
    let authors = '';
    if (book.authors && book.authors.length > 0) {
        authors = book.authors.map(a => {
            const name = a.name || '';
            // Try to convert "First Last" to "Last, First"
            const parts = name.split(' ');
            if (parts.length >= 2) {
                const last = parts.pop();
                return `${last}, ${parts.join(' ')}`;
            }
            return name;
        }).join('; ');
    }
    
    // Get year
    let year = '';
    if (book.publish_date) {
        const yearMatch = book.publish_date.match(/\d{4}/);
        if (yearMatch) year = yearMatch[0];
    }
    
    return {
        sourceType: 'book',
        title: book.title || '',
        author: authors,
        year: year,
        publisher: book.publishers?.[0]?.name || '',
        publisherLocation: book.publish_places?.[0]?.name || '',
        isbn: cleanISBN,
        pages: book.number_of_pages?.toString() || ''
    };
}

/**
 * Fallback: Lookup ISBN using Google Books API
 */
async function lookupISBNGoogleBooks(isbn) {
    console.log('[Citation] Trying Google Books for ISBN:', isbn);
    
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    
    if (!response.ok) {
        throw new Error('ISBN not found. Please check the ISBN and try again.');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
        throw new Error('ISBN not found. Please check the ISBN and try again.');
    }
    
    const book = data.items[0].volumeInfo;
    
    // Parse authors
    let authors = '';
    if (book.authors && book.authors.length > 0) {
        authors = book.authors.map(name => {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                const last = parts.pop();
                return `${last}, ${parts.join(' ')}`;
            }
            return name;
        }).join('; ');
    }
    
    // Get year
    let year = '';
    if (book.publishedDate) {
        const yearMatch = book.publishedDate.match(/\d{4}/);
        if (yearMatch) year = yearMatch[0];
    }
    
    return {
        sourceType: 'book',
        title: book.title || '',
        author: authors,
        year: year,
        publisher: book.publisher || '',
        isbn: isbn
    };
}

/**
 * Lookup URL metadata
 */
async function lookupURL(url) {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        throw new Error('Please enter a valid URL');
    }
    
    console.log('[Citation] Looking up URL:', url);
    
    // Use a CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('Failed to fetch URL');
        }
        
        const data = await response.json();
        
        if (!data.contents) {
            throw new Error('No content received');
        }
        
        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Extract metadata
        const title = 
            doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
            doc.querySelector('title')?.textContent ||
            doc.querySelector('h1')?.textContent ||
            '';
        
        const author = 
            doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
            doc.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
            '';
        
        const siteName = 
            doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
            new URL(url).hostname.replace('www.', '') ||
            '';
        
        const publishedDate = 
            doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
            doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
            doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
            '';
        
        // Parse year from date
        let year = '';
        if (publishedDate) {
            const yearMatch = publishedDate.match(/\d{4}/);
            if (yearMatch) year = yearMatch[0];
        }
        
        // Format author if found
        let formattedAuthor = author;
        if (author && !author.includes(',')) {
            const parts = author.split(' ');
            if (parts.length >= 2) {
                const last = parts.pop();
                formattedAuthor = `${last}, ${parts.join(' ')}`;
            }
        }
        
        return {
            sourceType: 'website',
            title: title.trim(),
            author: formattedAuthor,
            year: year || new Date().getFullYear().toString(),
            url: url,
            websiteName: siteName
        };
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The website may be slow or blocking requests.');
        }
        throw new Error('Could not fetch website data. Please enter details manually.');
    }
}

/**
 * Fill form with looked up data
 */
function fillFormWithData(data) {
    console.log('[Citation] Filling form with data:', data);
    
    // Set source type
    if (data.sourceType) {
        const sourceTypeSelect = document.getElementById('source-type');
        if (sourceTypeSelect) {
            sourceTypeSelect.value = data.sourceType;
            updateCitationForm();
        }
    }
    
    // Fill common fields
    setFieldValue('title', data.title);
    setFieldValue('author', data.author);
    setFieldValue('year', data.year);
    
    // Fill type-specific fields
    setFieldValue('url', data.url);
    setFieldValue('publisher', data.publisher);
    setFieldValue('publisher-location', data.publisherLocation);
    setFieldValue('isbn', data.isbn);
    setFieldValue('journal-name', data.journalName);
    setFieldValue('volume', data.volume);
    setFieldValue('issue', data.issue);
    setFieldValue('pages', data.pages);
    setFieldValue('doi', data.doi);
    setFieldValue('website-name', data.websiteName);
    
    // Set access date to today for websites
    if (data.sourceType === 'website') {
        setTodayDate();
    }
}

function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field && value) {
        field.value = value;
    }
}

// ============================================
// CITATION GENERATION
// ============================================

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
    if (!title) missingFields.push('Title');
    
    // Only require author and year if not a website (websites can use "n.d." and "n.a.")
    if (sourceType !== 'website') {
        if (!author) missingFields.push('Author');
        if (!year) missingFields.push('Year');
    }
    
    // Check source-specific required fields
    if (sourceType === 'book') {
        const publisher = document.getElementById('publisher').value.trim();
        if (!publisher) missingFields.push('Publisher');
    } else if (sourceType === 'journal') {
        const journalName = document.getElementById('journal-name').value.trim();
        if (!journalName) missingFields.push('Journal Name');
    } else if (sourceType === 'website') {
        const url = document.getElementById('url').value.trim();
        const accessDate = document.getElementById('access-date').value;
        if (!url) missingFields.push('URL');
        if (!accessDate) missingFields.push('Access Date');
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
        
        // Save to history
        saveCitationToHistory({
            style: currentCitationStyle,
            sourceType: sourceType,
            author: author || 'N.A.',
            year: year || 'n.d.',
            title: title,
            inText: inTextCitation,
            bibliography: bibliographyCitation
        });
        
        // Open the result modal
        openCitationResultModal();
    }
}

/**
 * Parse multiple authors
 */
function parseAuthors(authorStr) {
    if (!authorStr) return [];
    
    // Split by semicolon or "and"
    const authors = authorStr.split(/[;]|(?:\s+and\s+)/i)
        .map(a => a.trim())
        .filter(a => a);
    
    return authors.map(author => {
        // Check if already in "Last, First" format
        if (author.includes(',')) {
            const parts = author.split(',').map(p => p.trim());
            return { last: parts[0], first: parts[1] || '' };
        }
        // Convert "First Last" to parts
        const parts = author.split(' ');
        if (parts.length >= 2) {
            const last = parts.pop();
            return { last: last, first: parts.join(' ') };
        }
        return { last: author, first: '' };
    });
}

/**
 * Format authors for in-text citation
 */
function formatInTextAuthors(authorStr, style) {
    const authors = parseAuthors(authorStr);
    
    if (authors.length === 0) {
        return 'N.A.';
    } else if (authors.length === 1) {
        return authors[0].last;
    } else if (authors.length === 2) {
        const connector = style === 'apa' ? ' & ' : (style === 'mla' ? ' and ' : ' and ');
        return `${authors[0].last}${connector}${authors[1].last}`;
    } else {
        return `${authors[0].last} et al.`;
    }
}

/**
 * Format authors for bibliography
 */
function formatBibliographyAuthors(authorStr, style) {
    const authors = parseAuthors(authorStr);
    
    if (authors.length === 0) {
        return '';
    }
    
    if (style === 'apa') {
        if (authors.length === 1) {
            return `${authors[0].last}, ${authors[0].first ? authors[0].first.charAt(0) + '.' : ''}`;
        } else if (authors.length === 2) {
            return `${authors[0].last}, ${authors[0].first ? authors[0].first.charAt(0) + '.' : ''}, & ${authors[1].last}, ${authors[1].first ? authors[1].first.charAt(0) + '.' : ''}`;
        } else {
            const firstAuthors = authors.slice(0, -1).map(a => 
                `${a.last}, ${a.first ? a.first.charAt(0) + '.' : ''}`
            ).join(', ');
            const lastAuthor = authors[authors.length - 1];
            return `${firstAuthors}, & ${lastAuthor.last}, ${lastAuthor.first ? lastAuthor.first.charAt(0) + '.' : ''}`;
        }
    } else if (style === 'harvard') {
        if (authors.length === 1) {
            return `${authors[0].last}, ${authors[0].first ? authors[0].first.charAt(0) + '.' : ''}`;
        } else if (authors.length === 2) {
            return `${authors[0].last}, ${authors[0].first ? authors[0].first.charAt(0) + '.' : ''} and ${authors[1].last}, ${authors[1].first ? authors[1].first.charAt(0) + '.' : ''}`;
        } else {
            return `${authors[0].last}, ${authors[0].first ? authors[0].first.charAt(0) + '.' : ''} et al.`;
        }
    } else { // MLA
        if (authors.length === 1) {
            return `${authors[0].last}, ${authors[0].first}`;
        } else if (authors.length === 2) {
            return `${authors[0].last}, ${authors[0].first}, and ${authors[1].first} ${authors[1].last}`;
        } else {
            return `${authors[0].last}, ${authors[0].first}, et al.`;
        }
    }
}

/**
 * Generate APA 7th Edition citation
 */
function generateAPACitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim() || 'n.d.';
    const title = document.getElementById('title').value.trim();
    
    const authorLastName = formatInTextAuthors(author, 'apa');
    const bibAuthors = formatBibliographyAuthors(author, 'apa');
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            const edition = document.getElementById('edition')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}). <i>${title}</i>${edition ? ` (${edition} ed.)` : ''}. ${publisher}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            const doi = document.getElementById('doi')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}). ${title}. <i>${journalName}</i>, <i>${volume}</i>${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.`;
            if (doi) {
                bibliography += ` https://doi.org/${doi}`;
            }
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            const websiteName = document.getElementById('website-name')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            if (bibAuthors) {
                bibliography = `${bibAuthors} (${year}). ${title}. ${websiteName ? `<i>${websiteName}</i>. ` : ''}${url}`;
            } else {
                bibliography = `${title}. (${year}). ${websiteName ? `<i>${websiteName}</i>. ` : ''}Retrieved ${formatDate(accessDate, 'apa')}, from ${url}`;
            }
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}). ${title}. <i>${newspaperPublisher}</i>${newspaperPages ? `, ${newspaperPages}` : ''}.`;
            break;
    }
    
    return { inText, bibliography };
}

/**
 * Generate Harvard citation
 */
function generateHarvardCitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim() || 'n.d.';
    const title = document.getElementById('title').value.trim();
    
    const authorLastName = formatInTextAuthors(author, 'harvard');
    const bibAuthors = formatBibliographyAuthors(author, 'harvard');
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            const publisherLocation = document.getElementById('publisher-location')?.value.trim();
            const edition = document.getElementById('edition')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}) <i>${title}</i>${edition ? `, ${edition} edn` : ''}. ${publisherLocation ? `${publisherLocation}: ` : ''}${publisher}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            const doi = document.getElementById('doi')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}) '${title}', <i>${journalName}</i>, ${volume}${issue ? `(${issue})` : ''}${pages ? `, pp. ${pages}` : ''}.`;
            if (doi) {
                bibliography += ` doi: ${doi}.`;
            }
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            const websiteName = document.getElementById('website-name')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            if (bibAuthors) {
                bibliography = `${bibAuthors} (${year}) <i>${title}</i>. ${websiteName ? `${websiteName}. ` : ''}Available at: ${url} (Accessed: ${formatDate(accessDate, 'harvard')}).`;
            } else {
                bibliography = `<i>${title}</i> (${year}) ${websiteName ? `${websiteName}. ` : ''}Available at: ${url} (Accessed: ${formatDate(accessDate, 'harvard')}).`;
            }
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages')?.value.trim();
            
            inText = `(${authorLastName}, ${year})`;
            bibliography = `${bibAuthors} (${year}) '${title}', <i>${newspaperPublisher}</i>${newspaperPages ? `, p. ${newspaperPages}` : ''}.`;
            break;
    }
    
    return { inText, bibliography };
}

/**
 * Generate MLA 9th Edition citation
 */
function generateMLACitation(sourceType) {
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const title = document.getElementById('title').value.trim();
    
    const authorLastName = formatInTextAuthors(author, 'mla');
    const bibAuthors = formatBibliographyAuthors(author, 'mla');
    
    let inText = '';
    let bibliography = '';
    
    switch(sourceType) {
        case 'book':
            const publisher = document.getElementById('publisher').value.trim();
            const edition = document.getElementById('edition')?.value.trim();
            
            inText = `(${authorLastName}${year ? '' : ''})`;
            bibliography = `${bibAuthors}. <i>${title}</i>${edition ? `, ${edition} ed.` : ''}. ${publisher}, ${year || 'n.d.'}.`;
            break;
            
        case 'journal':
            const journalName = document.getElementById('journal-name').value.trim();
            const volume = document.getElementById('volume').value.trim();
            const issue = document.getElementById('issue').value.trim();
            const pages = document.getElementById('pages').value.trim();
            const doi = document.getElementById('doi')?.value.trim();
            
            inText = `(${authorLastName}${pages ? ` ${pages.split('-')[0]}` : ''})`;
            bibliography = `${bibAuthors}. "${title}." <i>${journalName}</i>, vol. ${volume}${issue ? `, no. ${issue}` : ''}, ${year || 'n.d.'}${pages ? `, pp. ${pages}` : ''}.`;
            if (doi) {
                bibliography += ` https://doi.org/${doi}.`;
            }
            break;
            
        case 'website':
            const url = document.getElementById('url').value.trim();
            const accessDate = document.getElementById('access-date').value;
            const websiteName = document.getElementById('website-name')?.value.trim();
            
            inText = `(${authorLastName || `"${title.substring(0, 30)}${title.length > 30 ? '...' : ''}"`})`;
            if (bibAuthors) {
                bibliography = `${bibAuthors}. "${title}." ${websiteName ? `<i>${websiteName}</i>, ` : ''}${year ? `${year}, ` : ''}${url}. Accessed ${formatDate(accessDate, 'mla')}.`;
            } else {
                bibliography = `"${title}." ${websiteName ? `<i>${websiteName}</i>, ` : ''}${year ? `${year}, ` : ''}${url}. Accessed ${formatDate(accessDate, 'mla')}.`;
            }
            break;
            
        case 'newspaper':
            const newspaperPublisher = document.getElementById('publisher').value.trim();
            const newspaperPages = document.getElementById('pages')?.value.trim();
            
            inText = `(${authorLastName})`;
            bibliography = `${bibAuthors}. "${title}." <i>${newspaperPublisher}</i>, ${year || 'n.d.'}${newspaperPages ? `, p. ${newspaperPages}` : ''}.`;
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
    const monthsShort = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 
                        'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const monthShort = monthsShort[date.getMonth()];
    const year = date.getFullYear();
    
    switch(style) {
        case 'apa':
            return `${month} ${day}, ${year}`;
        case 'harvard':
            return `${day} ${month} ${year}`;
        case 'mla':
            return `${day} ${monthShort} ${year}`;
        default:
            return `${month} ${day}, ${year}`;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
    
    // Close both modals
    closeCitationResultModal();
    closeCitationModal(true);
}

// ============================================
// CITATION HISTORY
// ============================================

/**
 * Save citation to history
 */
function saveCitationToHistory(citationData) {
    try {
        // Get existing history
        let history = JSON.parse(localStorage.getItem('citationHistory') || '[]');
        
        // Add new citation with timestamp
        const citation = {
            ...citationData,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random() // Unique ID
        };
        
        // Add to beginning of array (most recent first)
        history.unshift(citation);
        
        // Keep only last 50 citations
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        // Save to localStorage
        localStorage.setItem('citationHistory', JSON.stringify(history));
        
        console.log('[Citation] Saved to history:', citation);
    } catch (error) {
        console.error('[Citation] Error saving to history:', error);
    }
}

/**
 * Open citation history modal
 */
function openCitationHistory() {
    const modal = document.getElementById('citation-history-modal');
    if (modal) {
        modal.style.display = 'flex';
        loadCitationHistory();
    }
}

/**
 * Close citation history modal
 */
function closeCitationHistory() {
    const modal = document.getElementById('citation-history-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Load and display citation history
 */
function loadCitationHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('citationHistory') || '[]');
        const contentDiv = document.getElementById('citation-history-content');
        const emptyDiv = document.getElementById('citation-history-empty');
        const countSpan = document.getElementById('history-count');
        
        if (!contentDiv || !emptyDiv) return;
        
        // Update count
        if (countSpan) {
            countSpan.textContent = history.length;
        }
        
        if (history.length === 0) {
            contentDiv.innerHTML = '';
            emptyDiv.style.display = 'block';
            return;
        }
        
        emptyDiv.style.display = 'none';
        
        // Generate HTML for history items
        let html = '';
        history.forEach((citation, index) => {
            const date = new Date(citation.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            html += `
                <div class="history-item" style="border: 1px solid var(--border-primary); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; background: var(--background-secondary);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <div style="flex: 1;">
                            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                                <span style="font-size: 0.75rem; font-weight: 600; padding: 0.125rem 0.5rem; background: #667eea; color: white; border-radius: 0.25rem; text-transform: uppercase;">${citation.style}</span>
                                <span style="font-size: 0.75rem; color: var(--text-secondary);">${citation.sourceType}</span>
                            </div>
                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${escapeHtml(citation.title)}</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${escapeHtml(citation.author)} (${citation.year})</div>
                        </div>
                        <button onclick="deleteCitationFromHistory(${citation.id})" title="Delete" style="padding: 0.25rem 0.5rem; background: transparent; border: 1px solid var(--border-primary); border-radius: 0.25rem; cursor: pointer; color: #ef4444;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='transparent'">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 16px; height: 16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    <div style="font-size: 0.8rem; margin-bottom: 0.5rem;">
                        <div style="font-weight: 500; margin-bottom: 0.25rem; color: var(--text-secondary);">In-text:</div>
                        <div style="padding: 0.5rem; background: var(--background-primary); border-radius: 0.25rem; font-family: monospace; word-break: break-word;">${citation.inText}</div>
                    </div>
                    <div style="font-size: 0.8rem; margin-bottom: 0.75rem;">
                        <div style="font-weight: 500; margin-bottom: 0.25rem; color: var(--text-secondary);">Bibliography:</div>
                        <div style="padding: 0.5rem; background: var(--background-primary); border-radius: 0.25rem; font-family: monospace; word-break: break-word;">${citation.bibliography}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">${dateStr}</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="copyHistoryCitation(${index}, 'inText')" style="padding: 0.375rem 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">Copy In-text</button>
                            <button onclick="copyHistoryCitation(${index}, 'bibliography')" style="padding: 0.375rem 0.75rem; background: #10b981; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">Copy Bibliography</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        contentDiv.innerHTML = html;
    } catch (error) {
        console.error('[Citation] Error loading history:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Copy citation from history
 */
function copyHistoryCitation(index, type) {
    try {
        const history = JSON.parse(localStorage.getItem('citationHistory') || '[]');
        if (index >= 0 && index < history.length) {
            const citation = history[index];
            
            // Create a temporary div to strip HTML tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = type === 'inText' ? citation.inText : citation.bibliography;
            const text = tempDiv.textContent || tempDiv.innerText;
            
            navigator.clipboard.writeText(text).then(() => {
                if (typeof notify === 'function') {
                    notify(`${type === 'inText' ? 'In-text citation' : 'Bibliography'} copied!`);
                }
            }).catch(err => {
                console.error('[Citation] Copy failed:', err);
            });
        }
    } catch (error) {
        console.error('[Citation] Error copying from history:', error);
    }
}

/**
 * Delete citation from history
 */
function deleteCitationFromHistory(id) {
    try {
        let history = JSON.parse(localStorage.getItem('citationHistory') || '[]');
        history = history.filter(citation => citation.id !== id);
        localStorage.setItem('citationHistory', JSON.stringify(history));
        loadCitationHistory();
        
        if (typeof notify === 'function') {
            notify('Citation deleted from history');
        }
    } catch (error) {
        console.error('[Citation] Error deleting from history:', error);
    }
}

/**
 * Clear all citation history
 */
function clearCitationHistory() {
    if (confirm('Are you sure you want to clear all citation history? This action cannot be undone.')) {
        try {
            localStorage.removeItem('citationHistory');
            loadCitationHistory();
            
            if (typeof notify === 'function') {
                notify('Citation history cleared');
            }
        } catch (error) {
            console.error('[Citation] Error clearing history:', error);
        }
    }
}

// ============================================
// UNSAVED CONTENT CONFIRMATION MODAL
// ============================================

/**
 * Show unsaved content confirmation modal
 */
function showUnsavedContentModal(onConfirmCallback) {
    const modal = document.getElementById('unsaved-content-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Store the callback
        window.unsavedContentCallback = onConfirmCallback;
    }
}

/**
 * Close unsaved content confirmation modal
 */
function closeUnsavedContentModal() {
    const modal = document.getElementById('unsaved-content-modal');
    if (modal) {
        modal.style.display = 'none';
        window.unsavedContentCallback = null;
    }
}

/**
 * Confirm closing with unsaved content
 */
function confirmCloseWithUnsavedContent() {
    // Save the callback before closing the modal (which sets it to null)
    const callback = window.unsavedContentCallback;
    closeUnsavedContentModal();
    if (callback) {
        callback();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('citation-modal');
    const resultModal = document.getElementById('citation-result-modal');
    const historyModal = document.getElementById('citation-history-modal');
    const unsavedModal = document.getElementById('unsaved-content-modal');
    
    if (modal && event.target === modal) {
        closeCitationModal();
    }
    
    if (resultModal && event.target === resultModal) {
        closeCitationResultModal();
    }
    
    if (historyModal && event.target === historyModal) {
        closeCitationHistory();
    }
    
    if (unsavedModal && event.target.classList.contains('confirmation-modal-overlay')) {
        closeUnsavedContentModal();
    }
});

// Handle Enter key in auto-lookup input
document.addEventListener('DOMContentLoaded', function() {
    const lookupInput = document.getElementById('auto-lookup-input');
    if (lookupInput) {
        lookupInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                autoLookup();
            }
        });
    }
    
    // Initialize form
    updateCitationForm();
});
