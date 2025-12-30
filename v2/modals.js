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
    `;
  }
})();
