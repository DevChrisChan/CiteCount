/**
 * CiteCount - Modals & System UI Injection
 * This file contains all modal and system UI HTML that gets dynamically injected into the page
 * to reduce the size of index.html
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModals);
  } else {
    injectModals();
  }

  function injectModals() {
    const container = document.createElement('div');
    container.id = 'modals-container';
    container.innerHTML = getModalsHTML();
    document.body.appendChild(container);
  }

  function getModalsHTML() {
    return `
      <!-- Info Dialogue Modal -->
      <div id="info-dialogue" class="info-dialogue">
        <h3 id="info-dialogue-title">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span id="info-dialogue-title-text">Information</span>
        </h3>
        <p id="info-dialogue-content"></p>
        <button onclick="closeInfoDialogue()">Got it</button>
      </div>

      <!-- Perplexity Overlay -->
      <div id="perplexity-overlay" class="perplexity-overlay">
        <div class="perplexity-dialog" style="background-color: #091717; color: white;">
          <img src="/assets/pplx.svg" alt="Perplexity" style="width: 100%; display: block;">
          <div class="perplexity-content">
            <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; color: white;">12 Months Free Perplexity
              Pro for CiteCount users!</h2>
            <p style="margin-bottom: 20px; opacity: 0.9; color: #e2e8f0; line-height: 1.5;">
              Perplexity is offering students 12 months of Perplexity Pro for free.
              It's an AI-powered research assistant that helps you find credible sources and answers faster.
            </p>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button id="perplexity-dismiss-btn" onclick="dismissPerplexityOverlay()"
                data-lta-event="perplexity-overlay-dismiss"
                style="padding: 8px 16px; border-radius: 6px; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; opacity: 0.5; pointer-events: none;">Maybe
                Later (5)</button>
              <button onclick="claimPerplexityOffer()" data-lta-event="perplexity-overlay-claim"
                style="padding: 8px 16px; border-radius: 6px; background: #22d3ee; color: #091717; font-weight: bold; border: none; cursor: pointer;">Get
                Free Access</button>
            </div>
          </div>
        </div>
      </div>

      <!-- New Project/Folder Modal -->
      <div id="file-input-modal" class="file-input-modal" style="display: none;">
        <div class="file-input-modal-content">
          <h3 id="file-input-modal-title">Create New Project</h3>
          <div style="display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 1rem;">
            <div style="position: relative; flex-shrink: 0;">
              <button type="button" id="emoji-picker-toggle" class="emoji-picker-toggle" onclick="toggleEmojiPicker()" style="display: none;">
                <span id="selected-emoji-display">📄</span>
              </button>
              <div id="emoji-picker-container" class="emoji-picker-popup" style="display: none;">
                <div class="emoji-picker-grid">
                  <button type="button" class="emoji-option" data-emoji="📄" onclick="selectEmoji('📄')">📄</button>
                  <button type="button" class="emoji-option" data-emoji="📝" onclick="selectEmoji('📝')">📝</button>
                  <button type="button" class="emoji-option" data-emoji="📚" onclick="selectEmoji('📚')">📚</button>
                  <button type="button" class="emoji-option" data-emoji="📖" onclick="selectEmoji('📖')">📖</button>
                  <button type="button" class="emoji-option" data-emoji="📕" onclick="selectEmoji('📕')">📕</button>
                  <button type="button" class="emoji-option" data-emoji="📗" onclick="selectEmoji('📗')">📗</button>
                  <button type="button" class="emoji-option" data-emoji="📘" onclick="selectEmoji('📘')">📘</button>
                  <button type="button" class="emoji-option" data-emoji="📙" onclick="selectEmoji('📙')">📙</button>
                  <button type="button" class="emoji-option" data-emoji="📓" onclick="selectEmoji('📓')">📓</button>
                  <button type="button" class="emoji-option" data-emoji="📔" onclick="selectEmoji('📔')">📔</button>
                  <button type="button" class="emoji-option" data-emoji="📒" onclick="selectEmoji('📒')">📒</button>
                  <button type="button" class="emoji-option" data-emoji="📃" onclick="selectEmoji('📃')">📃</button>
                  <button type="button" class="emoji-option" data-emoji="📜" onclick="selectEmoji('📜')">📜</button>
                  <button type="button" class="emoji-option" data-emoji="📋" onclick="selectEmoji('📋')">📋</button>
                  <button type="button" class="emoji-option" data-emoji="📰" onclick="selectEmoji('📰')">📰</button>
                  <button type="button" class="emoji-option" data-emoji="🗂️" onclick="selectEmoji('🗂️')">🗂️</button>
                  <button type="button" class="emoji-option" data-emoji="📁" onclick="selectEmoji('📁')">📁</button>
                  <button type="button" class="emoji-option" data-emoji="📂" onclick="selectEmoji('📂')">📂</button>
                  <button type="button" class="emoji-option" data-emoji="🗃️" onclick="selectEmoji('🗃️')">🗃️</button>
                  <button type="button" class="emoji-option" data-emoji="🗄️" onclick="selectEmoji('🗄️')">🗄️</button>
                  <button type="button" class="emoji-option" data-emoji="✏️" onclick="selectEmoji('✏️')">✏️</button>
                  <button type="button" class="emoji-option" data-emoji="✒️" onclick="selectEmoji('✒️')">✒️</button>
                  <button type="button" class="emoji-option" data-emoji="🖊️" onclick="selectEmoji('🖊️')">🖊️</button>
                  <button type="button" class="emoji-option" data-emoji="🖋️" onclick="selectEmoji('🖋️')">🖋️</button>
                  <button type="button" class="emoji-option" data-emoji="💼" onclick="selectEmoji('💼')">💼</button>
                  <button type="button" class="emoji-option" data-emoji="🎓" onclick="selectEmoji('🎓')">🎓</button>
                  <button type="button" class="emoji-option" data-emoji="🎯" onclick="selectEmoji('🎯')">🎯</button>
                  <button type="button" class="emoji-option" data-emoji="🎨" onclick="selectEmoji('🎨')">🎨</button>
                  <button type="button" class="emoji-option" data-emoji="🔬" onclick="selectEmoji('🔬')">🔬</button>
                  <button type="button" class="emoji-option" data-emoji="💡" onclick="selectEmoji('💡')">💡</button>
                </div>
              </div>
            </div>
            <input type="text" id="file-input-modal-input" placeholder="Enter name..." style="flex: 1;" autocomplete="off" />
          </div>
          <div class="file-input-modal-actions">
            <button class="file-input-modal-btn cancel" onclick="closeFileInputModal()">Cancel</button>
            <button class="file-input-modal-btn confirm" onclick="confirmFileInput()">Create</button>
          </div>
        </div>
      </div>

      <!-- Citation History Modal -->
      <div id="citation-history-modal" class="citation-modal" style="display: none; z-index: 10001;">
        <div class="citation-modal-content">
          <div class="citation-modal-header">
            <h2>Citation History</h2>
            <button onclick="closeCitationHistory()" class="close-btn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="citation-modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div id="citation-history-content">
              <!-- History items will be dynamically loaded here -->
            </div>
            <div id="citation-history-empty" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary); display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 64px; height: 64px; margin: 0 auto 1rem; opacity: 0.3;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No citation history yet</p>
              <p style="font-size: 0.9rem; margin-top: 0.5rem;">Citations you generate will appear here</p>
            </div>
          </div>
          <div class="citation-modal-footer" style="border-top: 1px solid var(--border-primary); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.875rem; color: var(--text-secondary);">Last <span id="history-count">0</span> citations</span>
            <button onclick="clearCitationHistory()" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Clear All History</button>
          </div>
        </div>
      </div>

      <!-- Citation Generator Modal -->
      <div id="citation-modal" class="citation-modal" style="display: none;">
        <div class="citation-modal-content">
          <div class="citation-modal-header">
            <h2>Generate Citation</h2>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button onclick="openCitationHistory()" class="close-btn" title="Citation History" data-tooltip="Citation History">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button onclick="closeCitationModal()" class="close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="citation-modal-body">
            <!-- Auto-Lookup Section -->
            <div class="auto-lookup-section">
              <label>Quick Add - Auto-fill from identifier:</label>
              <div class="auto-lookup-input-group">
                <div class="auto-lookup-type-selector">
                  <button class="lookup-type-btn active" data-type="url" onclick="selectLookupType('url')" title="Website URL">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    URL
                  </button>
                  <button class="lookup-type-btn" data-type="doi" onclick="selectLookupType('doi')" title="Digital Object Identifier">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    DOI
                  </button>
                  <button class="lookup-type-btn" data-type="isbn" onclick="selectLookupType('isbn')" title="Book ISBN">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    ISBN
                  </button>
                </div>
                <div class="auto-lookup-input-wrapper">
                  <input type="text" id="auto-lookup-input" placeholder="Enter URL, DOI (10.xxxx/xxxxx), or ISBN" autocomplete="off" />
                  <button type="button" class="auto-lookup-btn" onclick="autoLookup()" id="auto-lookup-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lookup-icon">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-icon" style="display: none;">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    <span>Lookup</span>
                  </button>
                </div>
                <span class="help-text" id="lookup-status" style="display: none; margin-top: 0.25rem;"></span>
              </div>
            </div>

            <div class="citation-divider">
              <span>or fill in manually</span>
            </div>

            <!-- Citation Style Selector -->
            <div class="citation-style-selector">
              <label>Citation Style:</label>
              <div class="style-buttons">
                <button class="style-btn active" data-style="mla" onclick="selectCitationStyle('mla')">MLA 9th</button>
                <button class="style-btn" data-style="apa" onclick="selectCitationStyle('apa')">APA 7th</button>
                <button class="style-btn" data-style="harvard" onclick="selectCitationStyle('harvard')">Harvard</button>
              </div>
            </div>

            <!-- Source Type Selector -->
            <div class="source-type-selector">
              <label>Source Type:</label>
              <select id="source-type" onchange="updateCitationForm()">
                <option value="website" selected>Website</option>
                <option value="book">Book</option>
                <option value="journal">Journal Article</option>
                <option value="newspaper">Newspaper Article</option>
              </select>
            </div>

            <!-- Error Message Display -->
            <div id="citation-error" class="citation-error" style="display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
              <span id="citation-error-text"></span>
            </div>

            <!-- Success Message Display -->
            <div id="citation-success" class="citation-success" style="display: none;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              <span id="citation-success-text"></span>
            </div>

            <!-- Citation Form -->
            <div id="citation-form" class="citation-form">
              <!-- URL Fields (for websites) -->
              <div class="form-group" id="url-group" style="display: block;">
                <label>URL</label>
                <input type="text" id="url" placeholder="https://example.com" autocomplete="off" />
              </div>
              <div class="form-group" id="access-date-group" style="display: block;">
                <label>Access Date</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="date" id="access-date" style="flex: 1;" autocomplete="off" />
                  <button type="button" class="today-btn" onclick="setTodayDate()" title="Set to today" style="color: white !important;">
                    Today
                  </button>
                </div>
              </div>
              
              <!-- Common Fields -->
              <div class="form-group">
                <label>Author(s) <span class="help-text">(Last name, First name)</span></label>
                <input type="text" id="author" placeholder="e.g., Smith, John or Smith, John; Doe, Jane" autocomplete="off" />
              </div>
              <div class="form-group">
                <label>Year</label>
                <input type="text" id="year" placeholder="e.g., 2023" autocomplete="off" />
              </div>
              <div class="form-group">
                <label>Title</label>
                <input type="text" id="title" placeholder="Enter title" autocomplete="off" />
              </div>
              
              <!-- Publisher (for books and newspapers) -->
              <div class="form-group" id="publisher-group" style="display: none;">
                <label>Publisher</label>
                <input type="text" id="publisher" placeholder="Enter publisher" autocomplete="off" />
              </div>
              
              <!-- Publisher Location (for books) -->
              <div class="form-group" id="publisher-location-group" style="display: none;">
                <label>Publisher Location <span class="help-text">(optional)</span></label>
                <input type="text" id="publisher-location" placeholder="e.g., New York" autocomplete="off" />
              </div>
              
              <!-- Edition (for books) -->
              <div class="form-group" id="edition-group" style="display: none;">
                <label>Edition <span class="help-text">(optional)</span></label>
                <input type="text" id="edition" placeholder="e.g., 2nd" autocomplete="off" />
              </div>
              
              <!-- ISBN (for books) -->
              <div class="form-group" id="isbn-group" style="display: none;">
                <label>ISBN <span class="help-text">(optional)</span></label>
                <input type="text" id="isbn" placeholder="e.g., 978-0-123456-78-9" autocomplete="off" />
              </div>
              
              <!-- Journal Fields -->
              <div class="form-group" id="journal-group" style="display: none;">
                <label>Journal Name</label>
                <input type="text" id="journal-name" placeholder="Enter journal name" autocomplete="off" />
              </div>
              <div class="form-group" id="volume-group" style="display: none;">
                <label>Volume</label>
                <input type="text" id="volume" placeholder="e.g., 12" autocomplete="off" />
              </div>
              <div class="form-group" id="issue-group" style="display: none;">
                <label>Issue <span class="help-text">(optional)</span></label>
                <input type="text" id="issue" placeholder="e.g., 3" autocomplete="off" />
              </div>
              <div class="form-group" id="pages-group" style="display: none;">
                <label>Pages</label>
                <input type="text" id="pages" placeholder="e.g., 45-67" autocomplete="off" />
              </div>
              
              <!-- DOI (for journals) -->
              <div class="form-group" id="doi-group" style="display: none;">
                <label>DOI <span class="help-text">(optional)</span></label>
                <input type="text" id="doi" placeholder="e.g., 10.1000/xyz123" autocomplete="off" />
              </div>
              
              <!-- Website Name/Publisher -->
              <div class="form-group" id="website-name-group" style="display: block;">
                <label>Website Name <span class="help-text">(optional)</span></label>
                <input type="text" id="website-name" placeholder="e.g., BBC News, Wikipedia" autocomplete="off" />
              </div>
            </div>

            <!-- Generated Citation Output -->
            <div id="citation-output" class="citation-output" style="display: none;">
              <div style="margin-bottom: 1rem;">
                <label>In-Text Citation:</label>
                <div id="intext-citation-result" class="citation-result"></div>
                <button class="copy-citation-btn" onclick="copyInTextCitation()">Copy In-Text Citation</button>
              </div>
              <div>
                <label>Bibliography Entry:</label>
                <div id="bibliography-citation-result" class="citation-result"></div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                  <button class="copy-citation-btn" onclick="copyBibliographyCitation()" style="flex: 1;">Copy Bibliography</button>
                  <button class="append-citation-btn" onclick="appendToCiteCount()" style="flex: 1;">Append to CiteCount</button>
                </div>
              </div>
            </div>
          </div>
          <div class="citation-modal-footer">
            <div style="display: flex; gap: 0.5rem; width: 100%;">
              <button class="clear-form-btn" onclick="resetCitationForm()" style="flex: 0 0 auto;">Clear</button>
              <button class="generate-btn" onclick="generateCitation()" style="flex: 1;">Generate Citation</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paste Permission Help Modal -->
      <div id="paste-permission-modal" class="paste-permission-modal" style="display: none;">
        <div class="paste-permission-content">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">📋 Enable Clipboard Access</h2>
            <button onclick="closePastePermissionModal()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            CiteCount needs permission to access your clipboard to paste text. You've previously denied this permission.
          </p>

          <div class="browser-tabs mb-4">
            <button class="browser-tab active" onclick="showBrowserGuide('chrome')" data-browser="chrome">
              <svg viewBox="0 0 24 24" width="20" height="20" class="inline-block mr-1">
                <path fill="currentColor" d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z"/>
              </svg>
              Chrome
            </button>
            <button class="browser-tab" onclick="showBrowserGuide('safari')" data-browser="safari">
              Safari
            </button>
            <button class="browser-tab" onclick="showBrowserGuide('firefox')" data-browser="firefox">
              Firefox
            </button>
            <button class="browser-tab" onclick="showBrowserGuide('edge')" data-browser="edge">
              Edge
            </button>
          </div>

          <div id="chrome-guide" class="browser-guide active">
            <h3 class="font-semibold mb-3 text-lg">Chrome / Edge Instructions:</h3>
            <ol class="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li class="pl-2">
                <strong>Click the lock icon</strong> (or site info icon) in the address bar
                <div class="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  🔒 <span class="text-blue-600 dark:text-blue-400">citecount.com</span>
                </div>
              </li>
              <li class="pl-2 mt-3">Click <strong>"Site settings"</strong> or <strong>"Permissions"</strong></li>
              <li class="pl-2 mt-3">
                Find <strong>"Clipboard"</strong> in the permissions list
              </li>
              <li class="pl-2 mt-3">
                Change from <span class="text-red-600 dark:text-red-400 font-semibold">"Block"</span> to 
                <span class="text-green-600 dark:text-green-400 font-semibold">"Ask"</span> or 
                <span class="text-green-600 dark:text-green-400 font-semibold">"Allow"</span>
              </li>
              <li class="pl-2 mt-3">Refresh this page and try pasting again</li>
            </ol>
          </div>

          <div id="safari-guide" class="browser-guide">
            <h3 class="font-semibold mb-3 text-lg">Safari Instructions:</h3>
            <ol class="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li class="pl-2">Open Safari menu → <strong>Settings</strong> (or Preferences)</li>
              <li class="pl-2 mt-3">Go to the <strong>"Websites"</strong> tab</li>
              <li class="pl-2 mt-3">Select <strong>"Clipboard"</strong> or <strong>"Paste"</strong> in the left sidebar</li>
              <li class="pl-2 mt-3">
                Find <strong>citecount.com</strong> and change to <span class="text-green-600 dark:text-green-400 font-semibold">"Allow"</span> or <span class="text-green-600 dark:text-green-400 font-semibold">"Ask"</span>
              </li>
              <li class="pl-2 mt-3">Refresh this page and try pasting again</li>
            </ol>
            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm">
              <strong>💡 Tip:</strong> If you don't see citecount.com in the list, try pasting once more and Safari will prompt you again.
            </div>
          </div>

          <div id="firefox-guide" class="browser-guide">
            <h3 class="font-semibold mb-3 text-lg">Firefox Instructions:</h3>
            <ol class="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li class="pl-2">
                <strong>Click the shield icon</strong> or lock icon in the address bar
              </li>
              <li class="pl-2 mt-3">Click the <strong>arrow (→)</strong> or <strong>"More information"</strong></li>
              <li class="pl-2 mt-3">Go to the <strong>"Permissions"</strong> tab</li>
              <li class="pl-2 mt-3">
                Find <strong>"Use the Clipboard"</strong> and uncheck <span class="text-red-600 dark:text-red-400 font-semibold">"Block"</span>
              </li>
              <li class="pl-2 mt-3">Refresh this page and Firefox will ask for permission again</li>
            </ol>
            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-sm">
              <strong>💡 Alternative:</strong> You can also use Cmd/Ctrl + V keyboard shortcut to paste, which typically bypasses clipboard API restrictions.
            </div>
          </div>

          <div id="edge-guide" class="browser-guide">
            <h3 class="font-semibold mb-3 text-lg">Microsoft Edge Instructions:</h3>
            <p class="text-gray-700 dark:text-gray-300 mb-3">Edge uses the same settings as Chrome:</p>
            <ol class="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
              <li class="pl-2">
                <strong>Click the lock icon</strong> in the address bar
              </li>
              <li class="pl-2 mt-3">Click <strong>"Permissions for this site"</strong></li>
              <li class="pl-2 mt-3">
                Find <strong>"Clipboard"</strong> and change to <span class="text-green-600 dark:text-green-400 font-semibold">"Allow"</span>
              </li>
              <li class="pl-2 mt-3">Refresh this page and try pasting again</li>
            </ol>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <h4 class="font-semibold mb-2 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              Alternative Methods
            </h4>
            <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Use <strong>Cmd/Ctrl + V</strong> keyboard shortcut to paste directly</li>
              <li>• Right-click in the editor and select "Paste"</li>
              <li>• Drag and drop your Word or PDF file directly into CiteCount</li>
              <li>• Use the "Choose File" button to upload documents</li>
            </ul>
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="tryPasteAgain()" class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Try Again
            </button>
            <button onclick="closePastePermissionModal()" class="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Storage Quota Modal -->
      <div id="storage-quota-modal" class="storage-quota-modal" style="display: none;">
        <div class="storage-quota-content">
          <div class="storage-quota-header">
            <div>
              <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #dc2626;">
                <svg style="display: inline-block; vertical-align: middle; margin-right: 8px;" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Storage Quota Exceeded
              </h2>
              <p style="margin: 8px 0 0 0; font-size: 0.95rem; opacity: 0.8;">
                You have too many projects stored. Delete some projects to free up space and continue using CiteCount.
              </p>
            </div>
            <div style="margin-top: 16px;">
              <div style="display: flex; align-items: center; justify-between; margin-bottom: 8px;">
                <span style="font-weight: 600; font-size: 0.9rem;">Storage Usage</span>
                <span id="storage-quota-usage-text" style="font-size: 0.875rem; font-family: monospace; opacity: 0.8;">0 KB / 4.28 MB</span>
              </div>
              <div class="storage-bar-container">
                <div id="storage-quota-bar-fill" class="storage-bar-fill" style="width: 0%;"></div>
              </div>
            </div>
          </div>
          
          <div class="storage-quota-body">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
              <div style="display: flex; align-items: start; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style="flex: 1; font-size: 0.875rem; color: #991b1b;">
                  <strong>Important:</strong> Projects are sorted by size. Deleting larger projects will free up more space. You can select multiple projects to delete.
                </div>
              </div>
            </div>
            
            <div id="storage-quota-project-list" class="storage-quota-project-list">
              <!-- Projects will be dynamically added here -->
            </div>
          </div>
          
          <div class="storage-quota-footer">
            <div style="flex: 1; font-size: 0.875rem; opacity: 0.7;">
              <span id="storage-quota-selected-count">0 projects selected</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <button id="storage-quota-cancel-btn" 
                      onclick="closeStorageQuotaModal()"
                      class="storage-quota-btn-secondary">
                Cancel
              </button>
              <button id="storage-quota-delete-btn" 
                      onclick="deleteSelectedProjects()"
                      class="storage-quota-btn-danger"
                      disabled>
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dev Tools Window -->
      <div id="devToolsWindow" style="display: none; user-select: none;">
        <div id="devToolsHeader">
          <span>Dev Tools</span> <span id="currentLocation"
            style="margin-left: 8px; padding: 2px 6px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 12px; color: #666;"></span>
          <button id="devToolsClose">×</button>
        </div>
        <div id="devToolsTabs">
          <button class="tab-button active" data-tab="localstorage">Local Storage</button>
          <button class="tab-button" data-tab="system">System Info</button>
          <button class="tab-button" data-tab="internalSettings">Internal Settings</button>
          <button class="tab-button" data-tab="devToolsSettings">Dev Tools Settings</button>
          <button class="tab-button" data-tab="console">Console</button>
          <button class="tab-button" data-tab="errors">Errors</button>
          <button class="tab-button" data-tab="cookies">Cookies</button>
        </div>
        <div id="devToolsContent">
          <div class="tab-content active" id="localstorage">
            <div class="storage-controls">
              <button id="clearAllStorage">Clear All</button>
            </div>
            <table id="localStorageTable">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="tab-content" id="console">
            <pre id="consoleOutput"></pre>
          </div>
          <div class="tab-content" id="errors">
            <table id="errorsTable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="tab-content" id="system">
            <table id="systemTable">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="tab-content" id="cookies">
            <div class="storage-controls">
              <button id="clearAllCookies">Clear All</button>
            </div>
            <table id="cookiesTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="tab-content" id="internalSettings">
            <table id="internalSettingsTable">
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Disable Analytics</td>
                  <td><input type="checkbox" id="disableAnalytics"></td>
                </tr>
                <tr>
                  <td>Grant Pro</td>
                  <td><input type="checkbox" id="grantPro"></td>
                </tr>
                <tr>
                  <td>Restart app as prod</td>
                  <td>
                    <button id="restartApp">Restart</button>
                  </td>
                </tr>
                <tr>
                  <td>Restart app in debug mode</td>
                  <td>
                    <button id="restartDebug">Restart</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="tab-content" id="devToolsSettings">
            <table id="devToolsSettingsTable">
              <thead>
                <tr>
                  <th>Setting</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Disable Developer Mode</td>
                  <td><input type="checkbox" id="disableDevMode"></td>
                </tr>
                <tr>
                  <td>Opacity</td>
                  <td>
                    <input type="range" id="opacitySlider" min="0.1" max="1" step="0.1" value="0.9">
                  </td>
                </tr>
                <tr>
                  <td>Theme</td>
                  <td>
                    <button id="forceLightTheme">Light</button>
                    <button id="forceDarkTheme">Dark</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div id="resizeHandle"></div>
      </div>
    `;
  }
})();
