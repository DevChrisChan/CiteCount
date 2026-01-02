/**
 * CiteCount Citation Generator
 * Full-featured citation generator webapp
 */

// State Management
const state = {
  currentStyle: 'mla',
  currentSourceType: 'website',
  citations: [],
  currentCitationData: null,
  additionalAuthors: []
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Load saved citations from localStorage
  loadCitations();
  
  // Load default citation style
  loadDefaultCitationStyle();
  
  // Initialize event listeners
  initStyleTabs();
  initSourceTypeTabs();
  initFormSubmit();
  initNewsUrlListener();
  
  // Set default access date to today
  setToday();
  
  // Update mobile citation count
  updateMobileCitationCount();
}

// Style Tab Management
function initStyleTabs() {
  const styleTabs = document.querySelectorAll('.style-tab');
  styleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      styleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentStyle = tab.dataset.style;
      
      // Update variant buttons
      document.querySelectorAll('.variant-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === state.currentStyle);
      });
      
      // Regenerate citation if one exists
      if (state.currentCitationData) {
        generateCitation(state.currentCitationData);
      }
    });
  });
}

// Source Type Tab Management
function initSourceTypeTabs() {
  const sourceTypeBtns = document.querySelectorAll('.source-type-btn');
  sourceTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sourceTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentSourceType = btn.dataset.type;
      
      // Show/hide relevant form fields
      showRelevantFields(state.currentSourceType);
      
      // Show/hide URL autofill section (only for website type)
      const autofillSection = document.getElementById('url-autofill-section');
      autofillSection.style.display = ['website', 'newspaper', 'video'].includes(state.currentSourceType) ? 'block' : 'none';
      
      // Clear additional authors
      clearAdditionalAuthors();
      
      // Hide result section
      document.getElementById('citation-result-section').style.display = 'none';
    });
  });
}

function showRelevantFields(sourceType) {
  // Hide all form fields
  document.querySelectorAll('.form-fields').forEach(field => {
    field.style.display = 'none';
  });
  
  // Show relevant fields
  const fieldsId = `${sourceType}-fields`;
  const fields = document.getElementById(fieldsId);
  if (fields) {
    fields.style.display = 'flex';
  }
}

// Form Submission
function initFormSubmit() {
  const form = document.getElementById('citation-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect form data based on source type
    const data = collectFormData();
    
    if (!validateFormData(data)) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Store current citation data
    state.currentCitationData = data;
    
    // Generate and display citation
    generateCitation(data);
  });
}

function collectFormData() {
  const sourceType = state.currentSourceType;
  let data = { type: sourceType };
  
  // Collect additional authors
  const additionalAuthorRows = document.querySelectorAll('.additional-author-row');
  const additionalAuthors = [];
  additionalAuthorRows.forEach(row => {
    const firstName = row.querySelector('input[name="additional-author-first"]').value.trim();
    const lastName = row.querySelector('input[name="additional-author-last"]').value.trim();
    if (firstName || lastName) {
      additionalAuthors.push({ firstName, lastName });
    }
  });
  data.additionalAuthors = additionalAuthors;
  
  switch (sourceType) {
    case 'website':
      data = {
        ...data,
        authorFirst: document.getElementById('author-first').value.trim(),
        authorLast: document.getElementById('author-last').value.trim(),
        pageTitle: document.getElementById('page-title').value.trim(),
        websiteName: document.getElementById('website-name').value.trim(),
        publisher: document.getElementById('publisher').value.trim(),
        publishDate: document.getElementById('publish-date').value,
        accessDate: document.getElementById('access-date').value,
        url: document.getElementById('url').value.trim()
      };
      break;
      
    case 'book':
      data = {
        ...data,
        authorFirst: document.getElementById('book-author-first').value.trim(),
        authorLast: document.getElementById('book-author-last').value.trim(),
        title: document.getElementById('book-title').value.trim(),
        publisher: document.getElementById('book-publisher').value.trim(),
        year: document.getElementById('book-year').value,
        city: document.getElementById('book-city').value.trim(),
        edition: document.getElementById('book-edition').value.trim(),
        pages: document.getElementById('book-pages').value.trim(),
        isbn: document.getElementById('book-isbn').value.trim()
      };
      break;
      
    case 'journal':
      data = {
        ...data,
        authorFirst: document.getElementById('journal-author-first').value.trim(),
        authorLast: document.getElementById('journal-author-last').value.trim(),
        articleTitle: document.getElementById('article-title').value.trim(),
        journalName: document.getElementById('journal-name').value.trim(),
        volume: document.getElementById('journal-volume').value.trim(),
        issue: document.getElementById('journal-issue').value.trim(),
        year: document.getElementById('journal-year').value,
        pages: document.getElementById('journal-pages').value.trim(),
        doi: document.getElementById('journal-doi').value.trim(),
        url: document.getElementById('journal-url').value.trim()
      };
      break;
      
    case 'video':
      data = {
        ...data,
        title: document.getElementById('video-title').value.trim(),
        creator: document.getElementById('video-creator').value.trim(),
        platform: document.getElementById('video-platform').value.trim(),
        uploadDate: document.getElementById('video-upload-date').value,
        accessDate: document.getElementById('video-access-date').value,
        url: document.getElementById('video-url').value.trim(),
        duration: document.getElementById('video-duration').value.trim()
      };
      break;
      
    case 'newspaper':
      data = {
        ...data,
        authorFirst: document.getElementById('news-author-first').value.trim(),
        authorLast: document.getElementById('news-author-last').value.trim(),
        articleTitle: document.getElementById('news-article-title').value.trim(),
        paperName: document.getElementById('news-paper-name').value.trim(),
        publishDate: document.getElementById('news-publish-date').value,
        pages: document.getElementById('news-pages').value.trim(),
        url: document.getElementById('news-url').value.trim(),
        accessDate: document.getElementById('news-access-date').value
      };
      break;
      
    case 'image':
      data = {
        ...data,
        creatorFirst: document.getElementById('image-creator-first').value.trim(),
        creatorLast: document.getElementById('image-creator-last').value.trim(),
        title: document.getElementById('image-title').value.trim(),
        source: document.getElementById('image-source').value.trim(),
        date: document.getElementById('image-date').value,
        accessDate: document.getElementById('image-access-date').value,
        url: document.getElementById('image-url').value.trim(),
        medium: document.getElementById('image-medium').value.trim()
      };
      break;
  }
  
  return data;
}

function validateFormData(data) {
  switch (data.type) {
    case 'website':
      return data.pageTitle && data.websiteName && data.url && data.accessDate;
    case 'book':
      return data.authorFirst && data.authorLast && data.title && data.publisher && data.year;
    case 'journal':
      return data.authorFirst && data.authorLast && data.articleTitle && data.journalName && data.year;
    case 'video':
      return data.title && data.creator && data.platform && data.url;
    case 'newspaper':
      return data.articleTitle && data.paperName && data.publishDate;
    case 'image':
      return data.title && data.source && data.url && data.accessDate;
    default:
      return false;
  }
}

// Citation Generation
function generateCitation(data) {
  let citation = '';
  const style = state.currentStyle;
  
  switch (data.type) {
    case 'website':
      citation = generateWebsiteCitation(data, style);
      break;
    case 'book':
      citation = generateBookCitation(data, style);
      break;
    case 'journal':
      citation = generateJournalCitation(data, style);
      break;
    case 'video':
      citation = generateVideoCitation(data, style);
      break;
    case 'newspaper':
      citation = generateNewspaperCitation(data, style);
      break;
    case 'image':
      citation = generateImageCitation(data, style);
      break;
  }
  
  // Display the citation
  const resultSection = document.getElementById('citation-result-section');
  const previewDiv = document.getElementById('citation-preview');
  
  previewDiv.innerHTML = `<p>${citation}</p>`;
  resultSection.style.display = 'block';
  
  // Scroll to result
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Format Authors Helper
function formatAuthors(data, style) {
  const allAuthors = [];
  
  // Add primary author
  if (data.authorFirst || data.authorLast || data.creatorFirst || data.creatorLast) {
    allAuthors.push({
      firstName: data.authorFirst || data.creatorFirst || '',
      lastName: data.authorLast || data.creatorLast || ''
    });
  }
  
  // Add additional authors
  if (data.additionalAuthors && data.additionalAuthors.length > 0) {
    allAuthors.push(...data.additionalAuthors);
  }
  
  if (allAuthors.length === 0) return '';
  
  const formatAuthor = (author, isFirst, style) => {
    if (!author.firstName && !author.lastName) return '';
    
    switch (style) {
      case 'mla':
        if (isFirst) {
          return `${author.lastName}, ${author.firstName}`;
        }
        return `${author.firstName} ${author.lastName}`;
      case 'apa':
        if (isFirst) {
          return `${author.lastName}, ${author.firstName ? author.firstName.charAt(0) + '.' : ''}`;
        }
        return `${author.lastName}, ${author.firstName ? author.firstName.charAt(0) + '.' : ''}`;
      case 'chicago':
        if (isFirst) {
          return `${author.lastName}, ${author.firstName}`;
        }
        return `${author.firstName} ${author.lastName}`;
      case 'harvard':
        if (isFirst) {
          return `${author.lastName}, ${author.firstName ? author.firstName.charAt(0) + '.' : ''}`;
        }
        return `${author.lastName}, ${author.firstName ? author.firstName.charAt(0) + '.' : ''}`;
      default:
        return `${author.lastName}, ${author.firstName}`;
    }
  };
  
  if (allAuthors.length === 1) {
    return formatAuthor(allAuthors[0], true, style);
  } else if (allAuthors.length === 2) {
    const first = formatAuthor(allAuthors[0], true, style);
    const second = formatAuthor(allAuthors[1], false, style);
    if (style === 'apa' || style === 'harvard') {
      return `${first}, & ${second}`;
    }
    return `${first}, and ${second}`;
  } else {
    // 3+ authors
    if (style === 'mla') {
      return `${formatAuthor(allAuthors[0], true, style)}, et al.`;
    } else if (style === 'apa') {
      if (allAuthors.length <= 20) {
        const authors = allAuthors.map((a, i) => formatAuthor(a, i === 0, style));
        const lastAuthor = authors.pop();
        return `${authors.join(', ')}, & ${lastAuthor}`;
      }
      return `${formatAuthor(allAuthors[0], true, style)}, et al.`;
    } else if (style === 'chicago') {
      const authors = allAuthors.slice(0, 3).map((a, i) => formatAuthor(a, i === 0, style));
      return `${authors.join(', ')}, et al.`;
    } else if (style === 'harvard') {
      if (allAuthors.length > 3) {
        return `${formatAuthor(allAuthors[0], true, style)} et al.`;
      }
      const authors = allAuthors.map((a, i) => formatAuthor(a, i === 0, style));
      const lastAuthor = authors.pop();
      return `${authors.join(', ')} and ${lastAuthor}`;
    }
  }
  
  return '';
}

// Date Formatting Helper
function formatDate(dateStr, style) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShort = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 
                       'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
  
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  switch (style) {
    case 'mla':
      return `${day} ${monthsShort[month]} ${year}`;
    case 'apa':
      return `${year}, ${months[month]} ${day}`;
    case 'chicago':
      return `${months[month]} ${day}, ${year}`;
    case 'harvard':
      return `${day} ${months[month]} ${year}`;
    default:
      return `${months[month]} ${day}, ${year}`;
  }
}

// Website Citation
function generateWebsiteCitation(data, style) {
  const authors = formatAuthors(data, style);
  const title = data.pageTitle;
  const siteName = data.websiteName;
  const publisher = data.publisher;
  const pubDate = formatDate(data.publishDate, style);
  const accessDate = formatDate(data.accessDate, style);
  const url = data.url;
  
  switch (style) {
    case 'mla':
      let mla = '';
      if (authors) mla += `${authors}. `;
      mla += `"${title}." `;
      mla += `<em>${siteName}</em>, `;
      if (publisher && publisher !== siteName) mla += `${publisher}, `;
      if (pubDate) mla += `${pubDate}, `;
      mla += `${url}. `;
      mla += `Accessed ${accessDate}.`;
      return mla;
      
    case 'apa':
      let apa = '';
      if (authors) {
        apa += `${authors} `;
        apa += `(${pubDate || 'n.d.'}). `;
      } else {
        apa += `${title}. `;
        apa += `(${pubDate || 'n.d.'}). `;
      }
      if (authors) apa += `${title}. `;
      apa += `<em>${siteName}</em>. `;
      apa += `Retrieved ${accessDate}, from ${url}`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      if (authors) chicago += `${authors}. `;
      chicago += `"${title}." `;
      chicago += `${siteName}. `;
      if (publisher && publisher !== siteName) chicago += `${publisher}. `;
      if (pubDate) chicago += `${pubDate}. `;
      chicago += `Accessed ${accessDate}. `;
      chicago += `${url}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      if (authors) {
        harvard += `${authors} `;
      } else {
        harvard += `${siteName} `;
      }
      harvard += `(${data.publishDate ? new Date(data.publishDate).getFullYear() : 'n.d.'}) `;
      if (authors) harvard += `<em>${title}</em>. `;
      else harvard += `${title}. `;
      harvard += `Available at: ${url} `;
      harvard += `(Accessed: ${accessDate}).`;
      return harvard;
      
    default:
      return '';
  }
}

// Book Citation
function generateBookCitation(data, style) {
  const authors = formatAuthors(data, style);
  const title = data.title;
  const publisher = data.publisher;
  const year = data.year;
  const city = data.city;
  const edition = data.edition;
  const pages = data.pages;
  
  switch (style) {
    case 'mla':
      let mla = '';
      if (authors) mla += `${authors}. `;
      mla += `<em>${title}</em>. `;
      if (edition) mla += `${edition}, `;
      mla += `${publisher}, `;
      mla += `${year}.`;
      if (pages) mla += ` pp. ${pages}.`;
      return mla;
      
    case 'apa':
      let apa = '';
      if (authors) apa += `${authors} `;
      apa += `(${year}). `;
      apa += `<em>${title}</em>`;
      if (edition) apa += ` (${edition})`;
      apa += `. ${publisher}.`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      if (authors) chicago += `${authors}. `;
      chicago += `<em>${title}</em>. `;
      if (edition) chicago += `${edition}. `;
      if (city) chicago += `${city}: `;
      chicago += `${publisher}, ${year}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      if (authors) harvard += `${authors} `;
      harvard += `(${year}) `;
      harvard += `<em>${title}</em>. `;
      if (edition) harvard += `${edition}. `;
      if (city) harvard += `${city}: `;
      harvard += `${publisher}.`;
      return harvard;
      
    default:
      return '';
  }
}

// Journal Citation
function generateJournalCitation(data, style) {
  const authors = formatAuthors(data, style);
  const articleTitle = data.articleTitle;
  const journalName = data.journalName;
  const volume = data.volume;
  const issue = data.issue;
  const year = data.year;
  const pages = data.pages;
  const doi = data.doi;
  const url = data.url;
  
  switch (style) {
    case 'mla':
      let mla = '';
      if (authors) mla += `${authors}. `;
      mla += `"${articleTitle}." `;
      mla += `<em>${journalName}</em>, `;
      if (volume) mla += `vol. ${volume}, `;
      if (issue) mla += `no. ${issue}, `;
      mla += `${year}, `;
      if (pages) mla += `pp. ${pages}`;
      if (doi) mla += `. doi:${doi}`;
      else if (url) mla += `. ${url}`;
      mla += '.';
      return mla;
      
    case 'apa':
      let apa = '';
      if (authors) apa += `${authors} `;
      apa += `(${year}). `;
      apa += `${articleTitle}. `;
      apa += `<em>${journalName}</em>`;
      if (volume) apa += `, <em>${volume}</em>`;
      if (issue) apa += `(${issue})`;
      if (pages) apa += `, ${pages}`;
      apa += '.';
      if (doi) apa += ` https://doi.org/${doi}`;
      else if (url) apa += ` ${url}`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      if (authors) chicago += `${authors}. `;
      chicago += `"${articleTitle}." `;
      chicago += `<em>${journalName}</em> `;
      if (volume) chicago += `${volume}`;
      if (issue) chicago += `, no. ${issue}`;
      chicago += ` (${year})`;
      if (pages) chicago += `: ${pages}`;
      chicago += '.';
      if (doi) chicago += ` https://doi.org/${doi}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      if (authors) harvard += `${authors} `;
      harvard += `(${year}) `;
      harvard += `'${articleTitle}', `;
      harvard += `<em>${journalName}</em>`;
      if (volume) harvard += `, ${volume}`;
      if (issue) harvard += `(${issue})`;
      if (pages) harvard += `, pp. ${pages}`;
      harvard += '.';
      if (doi) harvard += ` doi: ${doi}.`;
      return harvard;
      
    default:
      return '';
  }
}

// Video Citation
function generateVideoCitation(data, style) {
  const title = data.title;
  const creator = data.creator;
  const platform = data.platform;
  const uploadDate = formatDate(data.uploadDate, style);
  const accessDate = formatDate(data.accessDate, style);
  const url = data.url;
  
  switch (style) {
    case 'mla':
      let mla = '';
      mla += `"${title}." `;
      mla += `<em>${platform}</em>, `;
      mla += `uploaded by ${creator}, `;
      if (uploadDate) mla += `${uploadDate}, `;
      mla += `${url}.`;
      if (accessDate) mla += ` Accessed ${accessDate}.`;
      return mla;
      
    case 'apa':
      let apa = '';
      apa += `${creator}. `;
      apa += `(${uploadDate || 'n.d.'}). `;
      apa += `<em>${title}</em> [Video]. `;
      apa += `${platform}. `;
      apa += `${url}`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      chicago += `${creator}. `;
      chicago += `"${title}." `;
      if (uploadDate) chicago += `${uploadDate}. `;
      chicago += `${platform} video. `;
      chicago += `${url}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      harvard += `${creator} `;
      harvard += `(${data.uploadDate ? new Date(data.uploadDate).getFullYear() : 'n.d.'}) `;
      harvard += `<em>${title}</em>. `;
      harvard += `Available at: ${url} `;
      harvard += `(Accessed: ${accessDate}).`;
      return harvard;
      
    default:
      return '';
  }
}

// Newspaper Citation
function generateNewspaperCitation(data, style) {
  const authors = formatAuthors(data, style);
  const articleTitle = data.articleTitle;
  const paperName = data.paperName;
  const pubDate = formatDate(data.publishDate, style);
  const pages = data.pages;
  const url = data.url;
  const accessDate = formatDate(data.accessDate, style);
  
  switch (style) {
    case 'mla':
      let mla = '';
      if (authors) mla += `${authors}. `;
      mla += `"${articleTitle}." `;
      mla += `<em>${paperName}</em>, `;
      if (pubDate) mla += `${pubDate}`;
      if (pages) mla += `, p. ${pages}`;
      mla += '.';
      if (url) mla += ` ${url}.`;
      return mla;
      
    case 'apa':
      let apa = '';
      if (authors) apa += `${authors} `;
      apa += `(${pubDate || 'n.d.'}). `;
      apa += `${articleTitle}. `;
      apa += `<em>${paperName}</em>`;
      if (pages) apa += `, ${pages}`;
      apa += '.';
      if (url) apa += ` ${url}`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      if (authors) chicago += `${authors}. `;
      chicago += `"${articleTitle}." `;
      chicago += `<em>${paperName}</em>, `;
      if (pubDate) chicago += `${pubDate}`;
      if (pages) chicago += `, ${pages}`;
      chicago += '.';
      if (url) chicago += ` ${url}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      if (authors) harvard += `${authors} `;
      harvard += `(${data.publishDate ? new Date(data.publishDate).getFullYear() : 'n.d.'}) `;
      harvard += `'${articleTitle}', `;
      harvard += `<em>${paperName}</em>, `;
      if (pubDate) harvard += `${pubDate}`;
      if (pages) harvard += `, p. ${pages}`;
      harvard += '.';
      if (url) harvard += ` Available at: ${url}`;
      if (url && accessDate) harvard += ` (Accessed: ${accessDate}).`;
      return harvard;
      
    default:
      return '';
  }
}

// Image Citation
function generateImageCitation(data, style) {
  const creator = formatAuthors({ authorFirst: data.creatorFirst, authorLast: data.creatorLast }, style);
  const title = data.title;
  const source = data.source;
  const date = formatDate(data.date, style);
  const accessDate = formatDate(data.accessDate, style);
  const url = data.url;
  const medium = data.medium;
  
  switch (style) {
    case 'mla':
      let mla = '';
      if (creator) mla += `${creator}. `;
      mla += `<em>${title}</em>. `;
      if (date) mla += `${date}. `;
      mla += `${source}, `;
      mla += `${url}. `;
      mla += `Accessed ${accessDate}.`;
      return mla;
      
    case 'apa':
      let apa = '';
      if (creator) apa += `${creator} `;
      apa += `(${date || 'n.d.'}). `;
      apa += `<em>${title}</em> `;
      if (medium) apa += `[${medium}]. `;
      apa += `${source}. `;
      apa += `${url}`;
      return apa;
      
    case 'chicago':
      let chicago = '';
      if (creator) chicago += `${creator}. `;
      chicago += `<em>${title}</em>. `;
      if (date) chicago += `${date}. `;
      if (medium) chicago += `${medium}. `;
      chicago += `${source}. `;
      chicago += `${url}.`;
      return chicago;
      
    case 'harvard':
      let harvard = '';
      if (creator) harvard += `${creator} `;
      harvard += `(${data.date ? new Date(data.date).getFullYear() : 'n.d.'}) `;
      harvard += `<em>${title}</em> `;
      if (medium) harvard += `[${medium}] `;
      harvard += `Available at: ${url} `;
      harvard += `(Accessed: ${accessDate}).`;
      return harvard;
      
    default:
      return '';
  }
}

// UI Actions
function setToday() {
  document.getElementById('access-date').value = new Date().toISOString().split('T')[0];
}

function setVideoToday() {
  document.getElementById('video-access-date').value = new Date().toISOString().split('T')[0];
}

function setNewsToday() {
  document.getElementById('news-access-date').value = new Date().toISOString().split('T')[0];
}

function setImageToday() {
  document.getElementById('image-access-date').value = new Date().toISOString().split('T')[0];
}

// Add/Remove Authors
function addAuthor() {
  const container = document.getElementById('additional-authors');
  const authorId = Date.now();
  
  const row = document.createElement('div');
  row.className = 'additional-author-row';
  row.dataset.authorId = authorId;
  row.innerHTML = `
    <div class="form-group">
      <label>First Name</label>
      <input type="text" name="additional-author-first" placeholder="First name">
    </div>
    <div class="form-group">
      <label>Last Name</label>
      <input type="text" name="additional-author-last" placeholder="Last name">
    </div>
    <button type="button" class="remove-author-btn" onclick="removeAuthor(${authorId})">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  
  container.appendChild(row);
}

function removeAuthor(authorId) {
  const row = document.querySelector(`.additional-author-row[data-author-id="${authorId}"]`);
  if (row) {
    row.remove();
  }
}

function clearAdditionalAuthors() {
  document.getElementById('additional-authors').innerHTML = '';
}

// Quick Style Switch
function switchStyleQuick(style) {
  state.currentStyle = style;
  
  // Update main style tabs
  document.querySelectorAll('.style-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.style === style);
  });
  
  // Update variant buttons
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
  
  // Regenerate citation
  if (state.currentCitationData) {
    generateCitation(state.currentCitationData);
  }
}

// Copy Citation
function copyCitation() {
  const preview = document.getElementById('citation-preview');
  const text = preview.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Citation copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showNotification('Citation copied to clipboard!', 'success');
  });
}

// Save Citation
function saveCitation() {
  if (!state.currentCitationData) return;
  
  const citation = {
    id: Date.now(),
    type: state.currentSourceType,
    style: state.currentStyle,
    data: state.currentCitationData,
    html: document.getElementById('citation-preview').innerHTML,
    text: document.getElementById('citation-preview').innerText,
    createdAt: new Date().toISOString()
  };
  
  // Get title for display
  switch (citation.type) {
    case 'website':
      citation.title = citation.data.pageTitle;
      break;
    case 'book':
      citation.title = citation.data.title;
      break;
    case 'journal':
      citation.title = citation.data.articleTitle;
      break;
    case 'video':
      citation.title = citation.data.title;
      break;
    case 'newspaper':
      citation.title = citation.data.articleTitle;
      break;
    case 'image':
      citation.title = citation.data.title;
      break;
  }
  
  state.citations.unshift(citation);
  saveCitations();
  renderCitations();
  updateMobileCitationCount();
  showNotification('Citation saved!', 'success');
}

// Citation Storage
function loadCitations() {
  try {
    const saved = localStorage.getItem('citecount-citations');
    if (saved) {
      state.citations = JSON.parse(saved);
      renderCitations();
    }
  } catch (e) {
    console.error('Error loading citations:', e);
  }
}

function saveCitations() {
  try {
    localStorage.setItem('citecount-citations', JSON.stringify(state.citations));
  } catch (e) {
    console.error('Error saving citations:', e);
  }
}

function renderCitations() {
  const container = document.getElementById('citations-list');
  const emptyState = document.getElementById('empty-state');
  
  if (state.citations.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Clear existing citation cards (but not empty state)
  const existingCards = container.querySelectorAll('.citation-card');
  existingCards.forEach(card => card.remove());
  
  // Render citation cards
  state.citations.forEach(citation => {
    const card = document.createElement('div');
    card.className = 'citation-card';
    card.dataset.citationId = citation.id;
    
    card.innerHTML = `
      <div class="citation-card-header">
        <span class="citation-card-type">${citation.type}</span>
        <span class="citation-card-style">${citation.style.toUpperCase()}</span>
      </div>
      <div class="citation-card-title">${citation.title || 'Untitled'}</div>
      <div class="citation-card-preview">${citation.text.substring(0, 100)}...</div>
      <div class="citation-card-actions">
        <button class="citation-card-btn" onclick="copyCitationById(${citation.id})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        </button>
        <button class="citation-card-btn delete" onclick="deleteCitation(${citation.id})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    `;
    
    container.appendChild(card);
  });
}

function copyCitationById(id) {
  const citation = state.citations.find(c => c.id === id);
  if (!citation) return;
  
  navigator.clipboard.writeText(citation.text).then(() => {
    showNotification('Citation copied!', 'success');
  });
}

function deleteCitation(id) {
  state.citations = state.citations.filter(c => c.id !== id);
  saveCitations();
  renderCitations();
  updateMobileCitationCount();
  showNotification('Citation deleted', 'success');
}

function clearAllCitations() {
  if (state.citations.length === 0) return;
  
  if (confirm('Are you sure you want to delete all citations? This cannot be undone.')) {
    state.citations = [];
    saveCitations();
    renderCitations();
    updateMobileCitationCount();
    showNotification('All citations cleared', 'success');
  }
}

function exportAllCitations() {
  if (state.citations.length === 0) {
    showNotification('No citations to export', 'error');
    return;
  }
  
  let content = 'Works Cited / Bibliography\n\n';
  
  // Group by style
  const grouped = {};
  state.citations.forEach(c => {
    if (!grouped[c.style]) grouped[c.style] = [];
    grouped[c.style].push(c);
  });
  
  for (const style in grouped) {
    content += `=== ${style.toUpperCase()} ===\n\n`;
    grouped[style].forEach((c, i) => {
      content += `${i + 1}. ${c.text}\n\n`;
    });
  }
  
  // Download as text file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'citations.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Citations exported!', 'success');
}

// Sidebar Management
function toggleSidebar() {
  const sidebar = document.getElementById('citations-sidebar');
  sidebar.classList.toggle('collapsed');
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('citations-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
}

function updateMobileCitationCount() {
  const count = state.citations.length;
  document.getElementById('mobile-citation-count').textContent = count;
}

// News URL listener (show access date when URL is entered)
function initNewsUrlListener() {
  const newsUrl = document.getElementById('news-url');
  const accessDateGroup = document.getElementById('news-access-date-group');
  
  if (newsUrl && accessDateGroup) {
    newsUrl.addEventListener('input', () => {
      accessDateGroup.style.display = newsUrl.value.trim() ? 'block' : 'none';
    });
  }
}

// URL Auto-fetch
async function fetchFromURL() {
  const urlInput = document.getElementById('url-input');
  const fetchBtn = document.getElementById('fetch-btn');
  const statusEl = document.getElementById('fetch-status');
  const url = urlInput.value.trim();
  
  if (!url) {
    statusEl.textContent = 'Please enter a URL';
    statusEl.className = 'fetch-status error';
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    statusEl.textContent = 'Please enter a valid URL';
    statusEl.className = 'fetch-status error';
    return;
  }
  
  // Show loading state
  fetchBtn.disabled = true;
  fetchBtn.classList.add('loading');
  statusEl.textContent = 'Fetching page information...';
  statusEl.className = 'fetch-status';
  
  try {
    // Use a CORS proxy or backend service for fetching
    // For now, we'll extract basic info from the URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Set basic info
    document.getElementById('url').value = url;
    
    // Try to extract website name from domain
    const siteName = domain.split('.')[0];
    document.getElementById('website-name').value = capitalizeFirstLetter(siteName);
    
    // Set today as access date
    setToday();
    
    statusEl.textContent = 'Basic info extracted. Please fill in the remaining fields manually.';
    statusEl.className = 'fetch-status success';
    
    // Note: Full metadata extraction would require a backend service
    // to bypass CORS restrictions. Consider using:
    // - OpenGraph meta tags via a proxy
    // - A serverless function to fetch and parse pages
    // - An API like microlink.io or urlbox.io
    
  } catch (error) {
    statusEl.textContent = 'Could not fetch page info. Please fill in fields manually.';
    statusEl.className = 'fetch-status error';
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.classList.remove('loading');
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  const textEl = document.getElementById('notification-text');
  const progressBar = document.getElementById('progress-bar');
  
  textEl.textContent = message;
  notification.className = 'show';
  
  // Set color based on type
  if (type === 'success') {
    notification.style.background = 'rgba(5, 150, 105, 0.9)';
  } else if (type === 'error') {
    notification.style.background = 'rgba(220, 38, 38, 0.9)';
  } else {
    notification.style.background = 'rgba(50, 50, 50, 0.9)';
  }
  
  // Animate progress bar
  progressBar.style.width = '100%';
  progressBar.style.transition = 'none';
  
  setTimeout(() => {
    progressBar.style.transition = 'width 3s linear';
    progressBar.style.width = '0%';
  }, 50);
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.className = '';
  }, 3000);
  
  // Allow dismissing by click
  notification.onclick = () => {
    notification.className = '';
  };
}

// Overlay Management
function toggleHelpOverlay(show) {
  const overlay = document.getElementById("help-overlay");
  const background = document.getElementById("overlay-background");
  
  if (show) {
    overlay.classList.add("open");
    background.classList.add("open");
  } else {
    overlay.classList.remove("open");
    background.classList.remove("open");
  }
}

function toggleSettingsOverlay(show) {
  const overlay = document.getElementById("settings-overlay");
  const background = document.getElementById("overlay-background");
  
  if (show) {
    overlay.classList.add("open");
    background.classList.add("open");
  } else {
    overlay.classList.remove("open");
    background.classList.remove("open");
  }
}

function closeOverlays() {
  toggleHelpOverlay(false);
  toggleSettingsOverlay(false);
}

function updateDefaultCitationStyle(style) {
  // Save to localStorage
  localStorage.setItem("citecount-default-citation-style", style);
  
  // Update the current style if no citation is being generated
  if (!state.currentCitationData) {
    state.currentStyle = style;
    document.querySelectorAll(".style-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.style === style);
    });
    document.querySelectorAll(".variant-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.style === style);
    });
  }
  
  showNotification(`Default citation style set to ${style.toUpperCase()}`, "success");
}

// Load default citation style on init
function loadDefaultCitationStyle() {
  const saved = localStorage.getItem("citecount-default-citation-style");
  if (saved) {
    const select = document.getElementById("defaultCitationStyleSelect");
    if (select) {
      select.value = saved;
    }
    // Also set the current style
    state.currentStyle = saved;
    document.querySelectorAll(".style-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.style === saved);
    });
    document.querySelectorAll(".variant-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.style === saved);
    });
  }
}
