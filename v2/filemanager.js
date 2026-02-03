// ============================================
// FILE MANAGEMENT SYSTEM
// ============================================

const LOCAL_BACKUP_MODAL_KEY = 'local_backup_modal_seen';
const LOCAL_BACKUP_PROJECT_THRESHOLD = 4;
let backupModalHandlersBound = false;

const fileManager = {
  projects: [],
  currentProject: null,
  folders: [],
  selectedProjects: new Set(), // Track selected projects for multi-delete

  init() {
    this.loadFromStorage();
    this.renderFileTree();
    this.updateMultiSelectToolbar();
    
    // Restore sidebar collapsed state
    const sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (sidebarCollapsed) {
      document.getElementById('file-sidebar').classList.add('collapsed');
      document.getElementById('sidebar-ad-box').classList.add('collapsed');
    }
    
    // Setup sidebar resize
    this.setupSidebarResize();
    
    // If no projects exist, create a default one
    if (this.projects.length === 0) {
      this.createProject('Untitled Project', true);
    } else if (!this.currentProject) {
      // Set the first project as current if none is selected
      this.currentProject = this.projects[0].id;
      this.loadProject(this.currentProject);
    }

    // Setup context menu handler
    document.addEventListener('click', (e) => {
      // Don't hide if clicking on the context menu or any of its children
      const contextMenu = document.getElementById('file-context-menu');
      if (contextMenu && contextMenu.contains(e.target)) {
        return;
      }
      this.hideContextMenu();
    }, true); // Use capture phase
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.file-tree-item')) {
        this.hideContextMenu();
      }
    });

    setupBackupReminderModalHandlers();
    this.checkBackupReminder();
  },

  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  getUniqueProjectName(baseName) {
    const existingNames = this.projects.map(p => p.name);
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    
    let counter = 2;
    while (existingNames.includes(`${baseName} (${counter})`)) {
      counter++;
    }
    return `${baseName} (${counter})`;
  },

  getRandomEmoji() {
    const emojis = ['📄', '📝', '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📃', '📜', '📋', '📰', '🗂️', '📁', '📂', '🗃️', '🗄️', '✏️', '✒️', '🖊️', '🖋️', '💼', '🎓', '🎯', '🎨', '🔬', '💡'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  },

  createProject(name = 'Untitled Project', autoSwitch = false, icon = null) {
    const maxOrder = Math.max(0, ...this.projects.map(p => p.order || 0));
    const uniqueName = this.getUniqueProjectName(name);
    const project = {
      id: this.generateId(),
      name: uniqueName,
      content: '',
      citations: [],
      folderId: null,
      order: maxOrder + 1,
      icon: icon || this.getRandomEmoji(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.push(project);
    this.saveToStorage();
    this.renderFileTree();

    this.checkBackupReminder();

    if (autoSwitch) {
      this.switchProject(project.id);
    }

    return project.id;
  },

  checkBackupReminder() {
    try {
      const seen = localStorage.getItem(LOCAL_BACKUP_MODAL_KEY) === 'true';
      if (seen) return;

      if (this.projects.length >= LOCAL_BACKUP_PROJECT_THRESHOLD) {
        const didShow = showLocalBackupReminderModal();
        if (didShow) {
          localStorage.setItem(LOCAL_BACKUP_MODAL_KEY, 'true');
        }
      }
    } catch (error) {
      console.warn('Unable to show backup reminder modal', error);
    }
  },

  createFolder(name = 'New Folder', parentId = null) {
    const maxOrder = Math.max(0, ...this.folders.map(f => f.order || 0));
    const folder = {
      id: this.generateId(),
      name: name,
      parentId: parentId,
      collapsed: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString()
    };

    this.folders.push(folder);
    this.saveToStorage();
    this.renderFileTree();

    return folder.id;
  },

  switchProject(projectId) {
    // Save current project before switching
    if (this.currentProject) {
      this.saveCurrentProject();
    }

    this.currentProject = projectId;
    this.loadProject(projectId);
    this.renderFileTree();
    
    // Close mobile sidebar after switching project (on mobile/tablet)
    if (window.innerWidth <= 1024) {
      const sidebar = document.getElementById('file-sidebar');
      const overlay = document.getElementById('mobile-sidebar-overlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  },

  saveCurrentProject() {
    if (!this.currentProject) return;

    const project = this.projects.find(p => p.id === this.currentProject);
    if (project) {
      const editor = document.getElementById('editor');
      project.content = editor.innerHTML;
      project.updatedAt = new Date().toISOString();
      
      // Save citation states
      project.citations = Array.from(state.includedCitations.entries());
      
      this.saveToStorage();
    }
  },

  loadProject(projectId) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    const editor = document.getElementById('editor');
    const highlightLayer = document.getElementById('highlight-layer');
    const welcomeText = document.getElementById('welcome-text');

    // Immediately set the new content
    editor.innerHTML = project.content || '';
    
    // Restore citation states
    if (project.citations && project.citations.length > 0) {
      state.includedCitations = new Map(project.citations);
    } else {
      state.includedCitations = new Map();
    }

    // Update welcome text visibility
    welcomeText.style.display = editor.innerText.trim() ? 'none' : 'block';

    // Add fade-in animation by triggering reflow and adding animation class
    editor.classList.remove('document-switching-fade-in');
    // Force reflow to reset animation
    void editor.offsetWidth;
    editor.classList.add('document-switching-fade-in');
    
    if (highlightLayer) {
      highlightLayer.classList.remove('document-switching-fade-in');
      void highlightLayer.offsetWidth;
      highlightLayer.classList.add('document-switching-fade-in');
    }

    // Trigger update
    handleEditorInput();
  },

  renameProject(projectId, newName) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.name = newName.trim() || 'Untitled Project';
      project.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.renderFileTree();
    }
  },

  renameFolder(folderId, newName) {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      folder.name = newName.trim() || 'Untitled Folder';
      this.saveToStorage();
      this.renderFileTree();
    }
  },

  deleteProject(projectId) {
    const projectIndex = this.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return;

    const wasCurrentProject = this.currentProject === projectId;
    
    this.projects.splice(projectIndex, 1);
    this.saveToStorage();

    if (wasCurrentProject) {
      // Switch to another project or create a new one
      if (this.projects.length > 0) {
        this.switchProject(this.projects[0].id);
      } else {
        this.currentProject = null;
        document.getElementById('editor').innerHTML = '';
        this.createProject('Untitled Project', true);
      }
    }

    this.renderFileTree();
  },

  deleteFolder(folderId) {
    // Move all projects in this folder to root
    this.projects.forEach(project => {
      if (project.folderId === folderId) {
        project.folderId = null;
      }
    });

    // Move all child folders to root
    this.folders.forEach(folder => {
      if (folder.parentId === folderId) {
        folder.parentId = null;
      }
    });

    // Delete the folder
    const folderIndex = this.folders.findIndex(f => f.id === folderId);
    if (folderIndex !== -1) {
      this.folders.splice(folderIndex, 1);
    }

    this.saveToStorage();
    this.renderFileTree();
  },

  moveToFolder(projectId, folderId) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.folderId = folderId;
      project.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.renderFileTree();
    }
  },

  toggleFolder(folderId) {
    const folder = this.folders.find(f => f.id === folderId);
    if (folder) {
      folder.collapsed = !folder.collapsed;
      this.saveToStorage();
      this.renderFileTree();
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('fileManager_projects', JSON.stringify(this.projects));
      localStorage.setItem('fileManager_folders', JSON.stringify(this.folders));
      localStorage.setItem('fileManager_currentProject', this.currentProject);
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        // Storage quota exceeded - show modal to let user delete projects
        this.showStorageQuotaModal();
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  },

  showStorageQuotaModal() {
    const modal = document.getElementById('storage-quota-modal');
    const overlay = document.getElementById('overlay-background');
    const projectListContainer = document.getElementById('storage-quota-project-list');
    
    if (!modal) return;
    
    // Calculate total storage used
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += new Blob([localStorage[key]]).size + key.length;
      }
    }
    
    const maxSize = 4.28 * 1024 * 1024; // 4.28MB in bytes (tested localStorage limit)
    const percentage = (totalSize / maxSize) * 100;
    
    // Update storage bar in modal
    const storageQuotaUsageText = document.getElementById('storage-quota-usage-text');
    const storageQuotaBarFill = document.getElementById('storage-quota-bar-fill');
    
    if (storageQuotaUsageText) {
      storageQuotaUsageText.textContent = `${this.formatBytes(totalSize)} / 4.28 MB`;
    }
    
    if (storageQuotaBarFill) {
      storageQuotaBarFill.style.width = `${Math.min(percentage, 100)}%`;
      
      // Change color based on usage
      storageQuotaBarFill.classList.remove('warning', 'danger');
      if (percentage >= 90) {
        storageQuotaBarFill.classList.add('danger');
      } else if (percentage >= 70) {
        storageQuotaBarFill.classList.add('warning');
      }
    }
    
    // Clear and populate project list
    projectListContainer.innerHTML = '';
    
    // Calculate storage size for each project
    const projectsWithSize = this.projects.map(project => {
      const size = new Blob([JSON.stringify(project)]).size;
      return { ...project, size };
    }).sort((a, b) => b.size - a.size); // Sort by size, largest first
    
    projectsWithSize.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = 'storage-quota-project-item';
      projectItem.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
          <input type="checkbox" 
                 id="delete-project-${project.id}" 
                 class="storage-quota-checkbox"
                 data-project-id="${project.id}"
                 onchange="updateStorageQuotaSelection()">
          <label for="delete-project-${project.id}" style="flex: 1; min-width: 0; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
              <span style="font-size: 1.2em;">${project.icon || '📄'}</span>
              <div style="flex: 1; min-width: 0; overflow: hidden;">
                <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${project.name}">
                  ${project.name}
                </div>
                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 2px;">
                  ${this.formatBytes(project.size)} • Last updated: ${this.formatDate(project.updatedAt)}
                </div>
              </div>
            </div>
          </label>
        </div>
      `;
      projectListContainer.appendChild(projectItem);
    });
    
    // Show modal
    modal.style.display = 'flex';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Update delete button state
    updateStorageQuotaSelection();
  },

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  },

  updateStorageDisplay() {
    const storageUsageText = document.getElementById('storage-usage-text');
    const storageBarFill = document.getElementById('storage-bar-fill');
    const projectCountText = document.getElementById('project-count-text');
    const storageProjectList = document.getElementById('storage-project-list');
    
    if (!storageUsageText || !storageBarFill || !projectCountText || !storageProjectList) return;
    
    // Calculate total storage used
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += new Blob([localStorage[key]]).size + key.length;
      }
    }
    
    const maxSize = 4.28 * 1024 * 1024; // 4.28MB in bytes (tested localStorage limit)
    const percentage = (totalSize / maxSize) * 100;
    
    // Update storage bar
    storageBarFill.style.width = `${Math.min(percentage, 100)}%`;
    
    // Change color based on usage
    storageBarFill.classList.remove('warning', 'danger');
    if (percentage >= 90) {
      storageBarFill.classList.add('danger');
    } else if (percentage >= 70) {
      storageBarFill.classList.add('warning');
    }
    
    // Update text
    storageUsageText.textContent = `${this.formatBytes(totalSize)} / 4.28 MB`;
    
    // Populate item list
    storageProjectList.innerHTML = '';
    
    // Collect all storage items (system + projects)
    const allItems = [];
    
    // Calculate grouped system items
    const settingsKeys = ['settings', 'sortState', 'sidebar_collapsed', 'isPremium', 'cookieConsent'];
    const appDataKeys = ['rawData', 'citationStates', 'fileManager_folders', 'fileManager_currentProject', 
                         'surveyAlertDismissedTimestamp', 'dismissedAnnouncementId', 'perplexityOverlayDismissed'];
    
    let settingsSize = 0;
    let appDataSize = 0;
    
    settingsKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data !== null) {
        settingsSize += new Blob([data]).size + key.length;
      }
    });
    
    appDataKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data !== null) {
        appDataSize += new Blob([data]).size + key.length;
      }
    });
    
    // Add grouped system items if they have data
    if (settingsSize > 0) {
      allItems.push({
        name: 'App Settings',
        icon: '⚙️',
        type: 'system',
        size: settingsSize,
        key: 'system-settings'
      });
    }
    
    if (appDataSize > 0) {
      allItems.push({
        name: 'Other App Data',
        icon: '📦',
        type: 'system',
        size: appDataSize,
        key: 'system-appdata'
      });
    }
    
    // Add projects
    this.projects.forEach(project => {
      const size = new Blob([JSON.stringify(project)]).size;
      allItems.push({
        ...project,
        size,
        type: 'project',
        key: project.id
      });
    });
    
    // Sort all items by size (largest first)
    allItems.sort((a, b) => b.size - a.size);
    
    // Update item count
    const itemCount = allItems.length;
    projectCountText.textContent = itemCount === 0 ? 'No items' : 
                                   itemCount === 1 ? '1 item' : 
                                   `${itemCount} items`;
    
    if (allItems.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = 'text-align: center; padding: 24px; opacity: 0.6;';
      emptyState.innerHTML = `
        <svg style="margin: 0 auto 8px;" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p style="font-size: 0.875rem;">No items in storage</p>
      `;
      storageProjectList.appendChild(emptyState);
      return;
    }
    
    allItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'storage-project-item';
      
      const isSystem = item.type === 'system';
      const isCurrent = item.type === 'project' && item.id === this.currentProject;
      
      if (isCurrent) {
        itemElement.classList.add('current-project');
      }
      
      let metaHtml = '';
      
      if (item.type === 'project' && item.createdAt) {
        const createdDate = new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        const updatedLabel = this.formatDate(item.updatedAt);
        
        metaHtml = `
          <div class="storage-project-meta">
            <span class="storage-project-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Created: ${createdDate}
            </span>
            <span class="storage-project-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Updated: ${updatedLabel}
            </span>
          </div>
        `;
      } else if (isSystem) {
        metaHtml = `
          <div class="storage-project-meta">
            <span class="storage-project-meta-item" style="color: #6b7280; font-style: italic;">
              System file - Required for app functionality
            </span>
          </div>
        `;
      }
      
      const displayName = item.type === 'project' ? item.name : item.name;
      const currentLabel = isCurrent ? ' <span style="font-size: 0.75em; opacity: 0.7;">(Current)</span>' : '';
      
      const deleteButton = isSystem ? 
        `<button class="storage-delete-btn" disabled style="opacity: 0.5; cursor: not-allowed;" title="System files cannot be deleted">
          <svg style="display: inline-block; vertical-align: middle; margin-right: 4px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Protected
        </button>` :
        `<button class="storage-delete-btn" onclick="deleteProjectFromStorage('${item.key}')">
          <svg style="display: inline-block; vertical-align: middle; margin-right: 4px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>`;
      
      itemElement.innerHTML = `
        <div class="storage-project-info">
          <span class="storage-project-icon">${item.icon || '📄'}</span>
          <div class="storage-project-details">
            <div class="storage-project-name" title="${displayName}">
              ${displayName}${currentLabel}
            </div>
            ${metaHtml}
          </div>
        </div>
        <div class="storage-project-actions">
          <span class="storage-project-size">${this.formatBytes(item.size)}</span>
          ${deleteButton}
        </div>
      `;
      
      storageProjectList.appendChild(itemElement);
    });
  },

  loadFromStorage() {
    const projectsData = localStorage.getItem('fileManager_projects');
    const foldersData = localStorage.getItem('fileManager_folders');
    const currentProjectData = localStorage.getItem('fileManager_currentProject');

    if (projectsData) {
      this.projects = JSON.parse(projectsData);
      // Ensure all projects have order values
      this.projects.forEach((project, index) => {
        if (project.order === undefined) {
          project.order = index;
        }
        // Ensure all projects have an icon
        if (!project.icon) {
          project.icon = '📄';
        }
      });
    }

    if (foldersData) {
      this.folders = JSON.parse(foldersData);
      // Ensure all folders have order values
      this.folders.forEach((folder, index) => {
        if (folder.order === undefined) {
          folder.order = index;
        }
      });
    }

    if (currentProjectData) {
      this.currentProject = currentProjectData;
    }
  },

  renderFileTree() {
    const container = document.getElementById('file-tree');
    if (!container) return;

    if (this.projects.length === 0 && this.folders.length === 0) {
      container.innerHTML = `
        <div class="sidebar-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No projects yet</p>
          <button class="sidebar-btn-full" onclick="createNewProject()">Create Your First Project</button>
        </div>
      `;
      return;
    }

    const html = this.buildFileTreeHTML(null);
    container.innerHTML = html;
  },

  startDrag(type, id, event) {
    this.draggedItem = { type, id };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
    event.target.classList.add('dragging');
  },

  handleDragEnd(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-folder').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-folder');
    });
    this.draggedItem = null;
  },

  handleDragOver(event, targetType, targetId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (!this.draggedItem) return;
    
    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = event.clientY;
    const elementMiddle = rect.top + rect.height / 2;
    
    // Remove all drag-over classes first
    document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-folder').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-folder');
    });
    
    // If dragging over a folder and it's a different type or different folder
    if (targetType === 'folder' && this.draggedItem.type === 'project') {
      targetElement.classList.add('drag-over-folder');
    } else if (this.draggedItem.id !== targetId) {
      // Show drop position indicator
      if (mouseY < elementMiddle) {
        targetElement.classList.add('drag-over-top');
      } else {
        targetElement.classList.add('drag-over-bottom');
      }
    }
  },

  handleDrop(targetType, targetId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.draggedItem || this.draggedItem.id === targetId) {
      this.handleDragEnd(event);
      return;
    }
    
    const data = this.draggedItem;
    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = event.clientY;
    const elementMiddle = rect.top + rect.height / 2;
    const dropPosition = mouseY < elementMiddle ? 'before' : 'after';
    
    // Handle moving project to folder
    if (data.type === 'project' && targetType === 'folder' && targetElement.classList.contains('drag-over-folder')) {
      this.moveToFolder(data.id, targetId);
      notify('Project moved to folder');
    }
    // Handle reordering
    else if (data.type === targetType) {
      this.reorderItems(data.type, data.id, targetId, dropPosition);
    }
    
    this.handleDragEnd(event);
  },

  reorderItems(type, draggedId, targetId, position) {
    const items = type === 'project' ? this.projects : this.folders;
    const draggedItem = items.find(item => item.id === draggedId);
    const targetItem = items.find(item => item.id === targetId);
    
    if (!draggedItem || !targetItem) return;
    
    // For projects, allow moving between different folders (including from folder to root)
    if (type === 'project') {
      // Update the folderId to match the target's folder context
      draggedItem.folderId = targetItem.folderId;
    } else {
      // For folders, only allow reordering in the same parent context
      if (draggedItem.parentId !== targetItem.parentId) return;
    }
    
    // Get all items in the target's context and sort by order
    const contextItems = items.filter(item => {
      if (type === 'project') {
        return item.folderId === targetItem.folderId;
      } else {
        return item.parentId === targetItem.parentId;
      }
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Remove dragged item from array if it's already there
    const draggedIndex = contextItems.findIndex(item => item.id === draggedId);
    if (draggedIndex !== -1) {
      contextItems.splice(draggedIndex, 1);
    }
    
    // Find target index and insert
    let targetIndex = contextItems.findIndex(item => item.id === targetId);
    if (position === 'after') {
      targetIndex++;
    }
    contextItems.splice(targetIndex, 0, draggedItem);
    
    // Reassign order values
    contextItems.forEach((item, index) => {
      item.order = index;
    });
    
    this.saveToStorage();
    this.renderFileTree();
  },

  buildFileTreeHTML(parentId) {
    let html = '';

    // Render folders first, sorted by order
    const folders = this.folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    folders.forEach(folder => {
      const isCollapsed = folder.collapsed;
      const toggleIcon = isCollapsed ? '▶' : '▼';

      html += `
        <div class="file-tree-item folder" 
             data-folder-id="${folder.id}"
             draggable="true"
             title="${this.escapeHtml(folder.name)}"
             ondragstart="fileManager.startDrag('folder', '${folder.id}', event)"
             ondragend="fileManager.handleDragEnd(event)"
             ondragover="fileManager.handleDragOver(event, 'folder', '${folder.id}')"
             ondrop="fileManager.handleDrop('folder', '${folder.id}', event)"
             oncontextmenu="showFolderContextMenu(event, '${folder.id}')">
          <span class="folder-toggle ${isCollapsed ? 'collapsed' : ''}" 
                onclick="event.stopPropagation(); fileManager.toggleFolder('${folder.id}')">${toggleIcon}</span>
          <span class="icon" onclick="event.stopPropagation(); fileManager.toggleFolder('${folder.id}')">📁</span>
          <span class="name" onclick="event.stopPropagation(); fileManager.toggleFolder('${folder.id}')" ondblclick="event.stopPropagation(); startRenamingFolder('${folder.id}')">${this.escapeHtml(folder.name)}</span>
          <div class="actions">
            <button class="file-action-btn" onclick="event.stopPropagation(); startRenamingFolder('${folder.id}')" title="Rename">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="file-action-btn" onclick="event.stopPropagation(); deleteFolder('${folder.id}')" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
      `;

      if (!isCollapsed) {
        const childrenHTML = this.buildFileTreeHTML(folder.id);
        if (childrenHTML) {
          html += `<div class="folder-children">${childrenHTML}</div>`;
        }
      }
    });

    // Render projects in this level, sorted by order
    const projects = this.projects
      .filter(p => p.folderId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    projects.forEach(project => {
      const isActive = project.id === this.currentProject;
      const activeClass = isActive ? 'active' : '';

      const isSelected = this.selectedProjects.has(project.id);
      const selectedClass = isSelected ? 'selected' : '';

      html += `
        <div class="file-tree-item ${activeClass} ${selectedClass}" 
             data-project-id="${project.id}"
             draggable="true"
             title="${this.escapeHtml(project.name)}"
             ondragstart="fileManager.startDrag('project', '${project.id}', event)"
             ondragend="fileManager.handleDragEnd(event)"
             ondragover="fileManager.handleDragOver(event, 'project', '${project.id}')"
             ondrop="fileManager.handleDrop('project', '${project.id}', event)"
             onclick="handleProjectClick(event, '${project.id}')"
             ondblclick="startRenamingProject('${project.id}')"
             oncontextmenu="showProjectContextMenu(event, '${project.id}')">
          <span class="icon project-icon-with-tooltip" data-tooltip="${this.escapeHtml(project.name)}" onclick="handleProjectIconClick(event, '${project.id}')">${project.icon || '📄'}</span>
          <span class="name">${this.escapeHtml(project.name)}</span>
          <div class="actions">
            <button class="file-action-btn" onclick="event.stopPropagation(); startRenamingProject('${project.id}')" title="Rename">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="file-action-btn" onclick="event.stopPropagation(); deleteProjectWithConfirmation('${project.id}')" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    });

    return html;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showContextMenu(x, y, items) {
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'file-context-menu';
    menu.id = 'file-context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('hr');
        separator.style.cssText = 'margin: 0.25rem 0; border: none; border-top: 1px solid var(--border-primary);';
        menu.appendChild(separator);
        return;
      }

      const menuItem = document.createElement('div');
      menuItem.className = 'file-context-menu-item' + (item.danger ? ' danger' : '');
      
      const iconSpan = document.createElement('span');
      if (item.icon) {
        iconSpan.innerHTML = item.icon;
        menuItem.appendChild(iconSpan);
      }
      
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      menuItem.appendChild(labelSpan);
      
      // Use addEventListener for more reliable event handling
      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log('Menu item clicked:', item.label);
        try {
          item.action();
        } catch (error) {
          console.error('Error executing menu action:', error);
        }
        this.hideContextMenu();
      }, true); // Use capture phase to ensure handler fires first
      
      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // Adjust position if menu goes off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }

    // Add keyboard listener for Escape key
    this.contextMenuKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    };
    document.addEventListener('keydown', this.contextMenuKeyHandler);
  },

  hideContextMenu() {
    const menu = document.getElementById('file-context-menu');
    if (menu) {
      menu.remove();
    }
    // Remove the keyboard event listener
    if (this.contextMenuKeyHandler) {
      document.removeEventListener('keydown', this.contextMenuKeyHandler);
      this.contextMenuKeyHandler = null;
    }
  },

  // ============================================
  // MULTI-SELECT FUNCTIONALITY
  // ============================================

  toggleProjectSelection(projectId, event) {
    // Prevent switching project when selecting
    if (event) {
      event.stopPropagation();
    }

    // If this is the first selection and current project isn't selected, auto-select it too
    if (this.selectedProjects.size === 0 && this.currentProject && this.currentProject !== projectId) {
      this.selectedProjects.add(this.currentProject);
    }

    if (this.selectedProjects.has(projectId)) {
      this.selectedProjects.delete(projectId);
    } else {
      this.selectedProjects.add(projectId);
    }

    this.renderFileTree();
    this.updateMultiSelectToolbar();
    this.updateSelectAllButtonTooltip();
  },

  selectAllProjects() {
    // If all projects are selected, unselect all; otherwise, select all
    const allSelected = this.selectedProjects.size === this.projects.length;
    
    if (allSelected) {
      // Unselect all
      this.selectedProjects.clear();
    } else {
      // Select all
      this.selectedProjects.clear();
      this.projects.forEach(project => {
        this.selectedProjects.add(project.id);
      });
    }
    
    this.renderFileTree();
    this.updateMultiSelectToolbar();
    this.updateSelectAllButtonTooltip();
  },

  clearSelection() {
    this.selectedProjects.clear();
    this.renderFileTree();
    this.updateMultiSelectToolbar();
    this.updateSelectAllButtonTooltip();
  },

  updateMultiSelectToolbar() {
    const toolbar = document.getElementById('multi-select-toolbar');
    if (!toolbar) return;

    const count = this.selectedProjects.size;
    const countDisplay = toolbar.querySelector('.selection-count');

    if (count > 0) {
      // Show toolbar only when items are selected
      toolbar.style.display = 'flex';
      countDisplay.textContent = `${count} selected`;
    } else {
      // Hide toolbar when no items selected
      toolbar.style.display = 'none';
    }
  },

  updateSelectAllButtonTooltip() {
    const selectAllBtn = document.querySelector('[onclick="fileManager.selectAllProjects()"]');
    if (!selectAllBtn) return;

    const allSelected = this.selectedProjects.size === this.projects.length && this.projects.length > 0;
    selectAllBtn.setAttribute('data-tooltip', allSelected ? 'Unselect All' : 'Select All');
  },

  deleteSelectedProjects() {
    if (this.selectedProjects.size === 0) return;

    const count = this.selectedProjects.size;
    const names = Array.from(this.selectedProjects)
      .map(id => this.projects.find(p => p.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3);
    
    const displayNames = names.join(', ') + (count > 3 ? ` and ${count - 3} more` : '');

    showNotification(
      `Are you sure you want to delete ${count} project${count > 1 ? 's' : ''}? (${displayNames})\n\nThis action cannot be undone.`,
      true,
      () => {
        const selectedIds = Array.from(this.selectedProjects);
        const deletedNames = [];

        selectedIds.forEach(projectId => {
          const project = this.projects.find(p => p.id === projectId);
          if (project) {
            deletedNames.push(project.name);
          }
          
          const projectIndex = this.projects.findIndex(p => p.id === projectId);
          if (projectIndex !== -1) {
            this.projects.splice(projectIndex, 1);
          }
        });

        // If current project was deleted, switch to another one
        if (this.selectedProjects.has(this.currentProject)) {
          if (this.projects.length > 0) {
            this.switchProject(this.projects[0].id);
          } else {
            this.currentProject = null;
            document.getElementById('editor').innerHTML = '';
            this.createProject('Untitled Project', true);
          }
        }

        this.selectedProjects.clear();
        this.saveToStorage();
        this.renderFileTree();
        this.updateMultiSelectToolbar();

        notify(`Deleted ${count} project${count > 1 ? 's' : ''}.`);
      },
      'confirmation'
    );
  }
};

// ============================================
// GLOBAL FUNCTIONS FOR UI INTERACTIONS
// ============================================

function handleProjectClick(event, projectId) {
  // Check if multi-select toolbar is visible
  const toolbar = document.getElementById('multi-select-toolbar');
  const isToolbarVisible = toolbar && toolbar.style.display === 'flex';
  
  // Cmd/Ctrl + Click or toolbar visible = toggle selection
  if (event.metaKey || event.ctrlKey || isToolbarVisible) {
    fileManager.toggleProjectSelection(projectId, event);
  } else if (fileManager.selectedProjects.size > 0) {
    // If items are selected, clicking switches to the project and clears selection
    fileManager.clearSelection();
    fileManager.switchProject(projectId);
  } else {
    // Normal click switches to the project
    fileManager.switchProject(projectId);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('file-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  
  // On mobile view, just toggle mobile-open state (drawer style)
  if (window.innerWidth <= 1024) {
    const isOpen = sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active', isOpen);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return;
  }
  
  // On desktop, toggle collapsed state
  sidebar.classList.add('transitioning');
  const isCollapsed = sidebar.classList.toggle('collapsed');
  
  if (isCollapsed) {
    // When collapsing, reset to collapsed width (48px)
    sidebar.style.width = '48px';
    sidebar.style.minWidth = '48px';
  } else {
    // When expanding, restore saved width or use default
    const savedWidth = localStorage.getItem('sidebar_width');
    const width = savedWidth ? Math.max(180, Math.min(500, parseInt(savedWidth))) : 260;
    sidebar.style.width = width + 'px';
    sidebar.style.minWidth = width + 'px';
  }
  
  // Save state to localStorage
  localStorage.setItem('sidebar_collapsed', isCollapsed);
  
  setTimeout(() => {
    sidebar.classList.remove('transitioning');
  }, 300);
}

// Toggle mobile sidebar (drawer-style on mobile/tablet)
function toggleMobileSidebar() {
  const sidebar = document.getElementById('file-sidebar');
  const overlay = document.getElementById('mobile-sidebar-overlay');
  
  if (!sidebar || !overlay) return;
  
  const isOpen = sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active', isOpen);
  
  // Prevent body scroll when sidebar is open on mobile
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Setup sidebar resizing functionality
fileManager.setupSidebarResize = function() {
  const sidebar = document.getElementById('file-sidebar');
  if (!sidebar) return;
  
  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'sidebar-resize-handle';
  sidebar.appendChild(resizeHandle);
  
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  const minWidth = 180;
  const maxWidth = 500;
  
  function startResize(e) {
    // Don't allow resizing if sidebar is collapsed or on mobile
    if (sidebar.classList.contains('collapsed')) return;
    if (window.innerWidth <= 1024) return;
    
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    resizeHandle.classList.add('resizing');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }
  
  function handleResize(e) {
    if (!isResizing) return;
    
    const delta = e.clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
    
    sidebar.style.width = newWidth + 'px';
    sidebar.style.minWidth = newWidth + 'px';
    
    // Update cursor based on boundaries
    if (newWidth <= minWidth) {
      document.body.style.cursor = 'e-resize';
    } else if (newWidth >= maxWidth) {
      document.body.style.cursor = 'w-resize';
    } else {
      document.body.style.cursor = 'ew-resize';
    }
    
    // Save to localStorage
    localStorage.setItem('sidebar_width', newWidth);
  }
  
  function stopResize() {
    if (!isResizing) return;
    
    isResizing = false;
    resizeHandle.classList.remove('resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  
  // Restore saved width
  const savedWidth = localStorage.getItem('sidebar_width');
  if (savedWidth && !sidebar.classList.contains('collapsed')) {
    const width = parseInt(savedWidth);
    if (width >= minWidth && width <= maxWidth) {
      sidebar.style.width = width + 'px';
      sidebar.style.minWidth = width + 'px';
    }
  }
  
  // Event listeners
  resizeHandle.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
};

function setupBackupReminderModalHandlers() {
  if (backupModalHandlersBound) return;

  const modal = document.getElementById('local-backup-reminder');
  const overlay = document.getElementById('local-backup-reminder-overlay');
  const closeBtn = document.getElementById('local-backup-reminder-close');
  const dismissBtn = document.getElementById('local-backup-reminder-dismiss');
  const exportBtn = document.getElementById('local-backup-reminder-export');

  if (!modal || !overlay) return;

  const closeTargets = [overlay, closeBtn, dismissBtn];
  let bound = false;

  closeTargets.forEach((el) => {
    if (el) {
      el.addEventListener('click', () => hideLocalBackupReminderModal());
      bound = true;
    }
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      hideLocalBackupReminderModal();
      if (typeof toggleSettingsOverlay === 'function') {
        toggleSettingsOverlay(true);
      }
    });
    bound = true;
  }

  if (bound) {
    backupModalHandlersBound = true;
  }
}

function showLocalBackupReminderModal() {
  setupBackupReminderModalHandlers();

  const modal = document.getElementById('local-backup-reminder');
  const overlay = document.getElementById('local-backup-reminder-overlay');
  const dialog = modal ? modal.querySelector('.local-backup-reminder-dialog') : null;

  if (!modal || !overlay || !dialog) return false;

  modal.style.display = 'block';
  overlay.style.display = 'block';
  dialog.style.opacity = '0';
  dialog.style.transform = 'translate(-50%, -50%) scale(0.98)';

  requestAnimationFrame(() => {
    dialog.style.opacity = '1';
    dialog.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  document.body.style.overflow = 'hidden';
  return true;
}

function hideLocalBackupReminderModal() {
  const modal = document.getElementById('local-backup-reminder');
  const overlay = document.getElementById('local-backup-reminder-overlay');
  const dialog = modal ? modal.querySelector('.local-backup-reminder-dialog') : null;

  if (!modal || !overlay || !dialog) return;

  dialog.style.opacity = '0';
  dialog.style.transform = 'translate(-50%, -50%) scale(0.98)';

  setTimeout(() => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }, 150);
}

let fileInputModalCallback = null;
let fileInputModalType = 'project';
let selectedEmoji = null;

function toggleEmojiPicker() {
  const picker = document.getElementById('emoji-picker-container');
  const isVisible = picker.style.display === 'block';
  picker.style.display = isVisible ? 'none' : 'block';
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  // Update visual selection
  document.querySelectorAll('.emoji-option').forEach(btn => {
    btn.classList.remove('selected');
  });
  const selectedBtn = document.querySelector(`[data-emoji="${emoji}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('selected');
  }
  // Update the display button
  document.getElementById('selected-emoji-display').textContent = emoji;
  // Close the picker
  document.getElementById('emoji-picker-container').style.display = 'none';
}

function showFileInputModal(title, placeholder, type, callback) {
  const modal = document.getElementById('file-input-modal');
  const titleEl = document.getElementById('file-input-modal-title');
  const input = document.getElementById('file-input-modal-input');
  const emojiToggle = document.getElementById('emoji-picker-toggle');
  const emojiPicker = document.getElementById('emoji-picker-container');
  
  titleEl.textContent = title;
  input.placeholder = placeholder;
  input.value = '';
  fileInputModalType = type;
  fileInputModalCallback = callback;
  
  // Show emoji picker only for projects
  if (type === 'project') {
    emojiToggle.style.display = 'flex';
    selectedEmoji = fileManager.getRandomEmoji();
    // Update display and selection
    document.getElementById('selected-emoji-display').textContent = selectedEmoji;
    document.querySelectorAll('.emoji-option').forEach(btn => {
      btn.classList.remove('selected');
    });
    const randomEmojiBtn = document.querySelector(`[data-emoji="${selectedEmoji}"]`);
    if (randomEmojiBtn) {
      randomEmojiBtn.classList.add('selected');
    }
  } else {
    emojiToggle.style.display = 'none';
    selectedEmoji = null;
  }
  
  // Hide picker popup initially
  emojiPicker.style.display = 'none';
  
  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
  
  // Handle Enter key
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      confirmFileInput();
    } else if (e.key === 'Escape') {
      closeFileInputModal();
    }
  };
}

function closeFileInputModal() {
  const modal = document.getElementById('file-input-modal');
  modal.style.display = 'none';
  fileInputModalCallback = null;
}

function confirmFileInput() {
  const input = document.getElementById('file-input-modal-input');
  const value = input.value.trim();
  
  // For projects, allow empty value (will default to "Untitled Project")
  // For folders, require a name
  if (!value && fileInputModalType !== 'project') {
    input.style.borderColor = '#ef4444';
    input.placeholder = 'Please enter a name...';
    setTimeout(() => {
      input.style.borderColor = '';
    }, 2000);
    return;
  }
  
  if (fileInputModalCallback) {
    if (fileInputModalType === 'project') {
      fileInputModalCallback(value || 'Untitled Project', selectedEmoji);
    } else {
      fileInputModalCallback(value);
    }
  }
  
  // Clear input and close modal
  input.value = '';
  selectedEmoji = null;
  closeFileInputModal();
}

function createNewProject() {
  showFileInputModal('Create New Project', 'Enter project name (optional)...', 'project', (name, emoji) => {
    const projectId = fileManager.createProject(name, true, emoji);
    const project = fileManager.projects.find(p => p.id === projectId);
    notify('Project created: ' + project.name);
  });
}

function createNewFolder() {
  showFileInputModal('Create New Folder', 'Enter folder name...', 'folder', (name) => {
    fileManager.createFolder(name);
    notify('Folder created: ' + name);
  });
}

function startRenamingProject(projectId) {
  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) {
    console.warn('Project not found:', projectId);
    return;
  }

  // Hide context menu if open
  fileManager.hideContextMenu();

  const item = document.querySelector(`[data-project-id="${projectId}"]`);
  if (!item) {
    console.warn('Project item element not found:', projectId);
    return;
  }

  const nameSpan = item.querySelector('.name');
  if (!nameSpan) {
    console.warn('Name span not found in project item');
    return;
  }

  const currentName = project.name;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'file-rename-input';

  const finishRename = () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      fileManager.renameProject(projectId, newName);
    } else {
      fileManager.renderFileTree();
    }
  };

  input.onblur = finishRename;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      finishRename();
    } else if (e.key === 'Escape') {
      fileManager.renderFileTree();
    }
  };

  nameSpan.replaceWith(input);
  input.focus();
  input.select();
}

function startRenamingFolder(folderId) {
  const folder = fileManager.folders.find(f => f.id === folderId);
  if (!folder) {
    console.warn('Folder not found:', folderId);
    return;
  }

  // Hide context menu if open
  fileManager.hideContextMenu();

  const item = document.querySelector(`[data-folder-id="${folderId}"]`);
  if (!item) {
    console.warn('Folder item element not found:', folderId);
    return;
  }

  const nameSpan = item.querySelector('.name');
  if (!nameSpan) {
    console.warn('Name span not found in folder item');
    return;
  }

  const currentName = folder.name;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'file-rename-input';

  const finishRename = () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      fileManager.renameFolder(folderId, newName);
    } else {
      fileManager.renderFileTree();
    }
  };

  input.onblur = finishRename;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      finishRename();
    } else if (e.key === 'Escape') {
      fileManager.renderFileTree();
    }
  };

  nameSpan.replaceWith(input);
  input.focus();
  input.select();
}

function deleteProjectWithConfirmation(projectId) {
  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) return;

  showNotification(
    `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
    true,
    () => {
      fileManager.deleteProject(projectId);
      notify('Project deleted: ' + project.name);
    },
    'confirmation'
  );
}

function deleteFolder(folderId) {
  const folder = fileManager.folders.find(f => f.id === folderId);
  if (!folder) return;

  showNotification(
    `Delete folder "${folder.name}"? Projects inside will be moved to root.`,
    true,
    () => {
      fileManager.deleteFolder(folderId);
      notify('Folder deleted: ' + folder.name);
    },
    'confirmation'
  );
}

function showProjectContextMenu(event, projectId) {
  event.preventDefault();
  event.stopPropagation();

  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) return;

  const folders = fileManager.folders.filter(f => f.id !== project.folderId);

  const menuItems = [
    {
      icon: 'ℹ️',
      label: 'Get Info',
      action: () => showProjectInfoModal(projectId)
    },
    {
      icon: '✏️',
      label: 'Rename',
      action: () => startRenamingProject(projectId)
    },
    {
      icon: '📁',
      label: 'Move to Folder',
      action: () => {
        if (folders.length === 0) {
          notify('No folders available. Create a folder first.');
          return;
        }
        showMoveToFolderMenu(projectId, folders);
      }
    }
  ];

  if (project.folderId) {
    menuItems.push({
      icon: '↩️',
      label: 'Move to Root',
      action: () => fileManager.moveToFolder(projectId, null)
    });
  }

  menuItems.push({ separator: true });
  menuItems.push({
    icon: '🗑️',
    label: 'Delete',
    danger: true,
    action: () => deleteProjectWithConfirmation(projectId)
  });

  fileManager.showContextMenu(event.pageX, event.pageY, menuItems);
}

function showFolderContextMenu(event, folderId) {
  event.preventDefault();
  event.stopPropagation();

  const menuItems = [
    {
      icon: '✏️',
      label: 'Rename',
      action: () => startRenamingFolder(folderId)
    },
    { separator: true },
    {
      icon: '🗑️',
      label: 'Delete',
      danger: true,
      action: () => deleteFolder(folderId)
    }
  ];

  fileManager.showContextMenu(event.pageX, event.pageY, menuItems);
}

// ============================================
// PROJECT INFO MODAL
// ============================================

function showProjectInfoModal(projectId) {
  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) return;

  // Calculate metadata
  const contentLength = project.content ? project.content.length : 0;
  
  // Count words (basic word count without citation filtering)
  let wordCount = 0;
  if (project.content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = project.content;
    const text = tempDiv.innerText || tempDiv.textContent || '';
    wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }
  
  // Count citations
  const citationCount = project.citations ? project.citations.length : 0;
  
  // Format dates
  const createdDate = new Date(project.createdAt);
  const modifiedDate = new Date(project.updatedAt);
  
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'file-info-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--background-primary);
    border: 1px solid var(--border-primary);
    border-radius: 0.5rem;
    padding: 2rem;
    z-index: 1001;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary);">Document Info</h2>
      <button class="close-info-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">✕</button>
    </div>
    
    <div style="space-y: 1rem;">
      <!-- File Name -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Document Name</div>
        <div style="color: var(--text-primary); font-weight: 600; word-break: break-word;">${fileManager.escapeHtml(project.name)}</div>
      </div>

      <!-- File Size -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">File Size</div>
        <div style="color: var(--text-primary); font-weight: 600;">
          ${contentLength} bytes (${(contentLength / 1024).toFixed(2)} KB)
        </div>
      </div>

      <!-- Word Count -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Word Count</div>
        <div style="color: var(--text-primary); font-weight: 600;">${wordCount.toLocaleString()} words</div>
      </div>

      <!-- Character Count -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Character Count</div>
        <div style="color: var(--text-primary); font-weight: 600;">${contentLength.toLocaleString()} characters</div>
      </div>

      <!-- Citation Count -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Citation Count</div>
        <div style="color: var(--text-primary); font-weight: 600;">${citationCount} citations</div>
      </div>

      <!-- Created Date -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Created Date</div>
        <div style="color: var(--text-primary); font-weight: 600;">${formatDate(createdDate)}</div>
      </div>

      <!-- Last Modified Date -->
      <div style="margin-bottom: 1.25rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Last Modified</div>
        <div style="color: var(--text-primary); font-weight: 600;">${formatDate(modifiedDate)}</div>
      </div>

      <!-- Document ID (for reference) -->
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--background-secondary); border-radius: 0.375rem; border: 1px solid var(--border-primary);">
        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 500;">Document ID</div>
        <div style="color: var(--text-primary); font-family: monospace; font-size: 0.875rem; word-break: break-all;">${project.id}</div>
      </div>
    </div>

    <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button class="close-info-modal" style="padding: 0.625rem 1.25rem; border: 1px solid var(--border-primary); background: transparent; color: var(--text-primary); border-radius: 0.375rem; cursor: pointer; font-weight: 500; transition: background 0.2s;">Close</button>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.className = 'file-info-overlay';
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;';
  
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  // Close button handlers
  const closeButtons = modal.querySelectorAll('.close-info-modal');
  const closeModal = () => {
    modal.remove();
    overlay.remove();
  };
  
  closeButtons.forEach(btn => {
    btn.onclick = closeModal;
  });
  
  overlay.onclick = closeModal;

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

function showMoveToFolderMenu(projectId, folders) {
  // Hide context menu if open
  fileManager.hideContextMenu();

  if (!folders || folders.length === 0) {
    console.warn('No folders available to move to');
    notify('No folders available. Create a folder first.');
    return;
  }

  // Create a custom modal for folder selection
  const modal = document.createElement('div');
  modal.className = 'file-select-modal';
  modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background-primary); border: 1px solid var(--border-primary); border-radius: 0.5rem; padding: 1.5rem; z-index: 1001; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
  
  modal.innerHTML = `
    <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--text-primary);">Move to Folder</h3>
    <div style="max-height: 300px; overflow-y: auto;">
      ${folders.map(folder => `
        <div class="folder-option" data-folder-id="${folder.id}" style="padding: 0.75rem; margin: 0.25rem 0; border-radius: 0.375rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; user-select: none;" onmouseover="this.style.background='var(--background-secondary)'" onmouseout="this.style.background='transparent'">
          <span>📁</span>
          <span style="color: var(--text-primary);">${fileManager.escapeHtml(folder.name)}</span>
        </div>
      `).join('')}
    </div>
    <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="file-input-modal-btn cancel" style="padding: 0.5rem 1rem; border: 1px solid var(--border-primary); background: transparent; color: var(--text-primary); border-radius: 0.375rem; cursor: pointer;">Cancel</button>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;';
  
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  
  // Set up folder option click handlers
  const folderOptions = modal.querySelectorAll('.folder-option');
  folderOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const folderId = option.dataset.folderId;
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        fileManager.moveToFolder(projectId, folderId);
        notify('Project moved to ' + folder.name);
      } else {
        console.warn('Folder not found:', folderId);
      }
      modal.remove();
      overlay.remove();
    });
  });
  
  // Set up cancel button
  const cancelBtn = modal.querySelector('.cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modal.remove();
      overlay.remove();
    });
  }
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      modal.remove();
      overlay.remove();
    }
  });

  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// ============================================
// PROJECT ICON CLICK HANDLER
// ============================================

function handleProjectIconClick(event, projectId) {
  event.stopPropagation();
  
  const sidebar = document.getElementById('file-sidebar');
  const isCollapsed = sidebar.classList.contains('collapsed');
  
  if (isCollapsed) {
    // When collapsed, clicking icon switches to the project
    fileManager.switchProject(projectId);
  } else {
    // When expanded, clicking icon opens the icon picker
    showIconPicker(projectId, event);
  }
}

// ============================================
// ICON PICKER FUNCTIONALITY
// ============================================

const projectIcons = [
  // General
  '📄', '📝', '📚', '📖', '📋', '✏️',
  // Science
  '🔬', '🧪', '🧬', '⚗️', '🦠', '🔭',
  // Math & Physics
  '📐', '📏', '🧮', '⚛️', '🔢',
  // Technology & CS
  '💻', '🖥️', '⌨️', '🖱️', '💾',
  // Chemistry & Biology
  '⚗️', '🧫', '🌱',
  // Geography & Environment
  '🌍', '🗺️', '🏔️',
  // History & Social
  '🏛️', '📜', '⏳', '🏺',
  // Economics & Business
  '💰', '📊', '📈', '💼', '🏦',
  // Languages & Literature
  '📕', '📗', '📘', '📙', '✍️', '🗣️',
  // Arts & Music
  '🎨', '🎭', '🎵', '🎼', '🖼️',
  // Sports & PE
  '⚽', '🏀', '🏃', '🤸',
  // Other
  '⭐', '✨', '💡', '🎯', '🔥'
];

function showIconPicker(projectId, event) {
  event.stopPropagation();
  
  // Remove any existing picker
  const existingPicker = document.getElementById('icon-picker-modal');
  if (existingPicker) {
    existingPicker.remove();
  }
  
  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) return;
  
  const modal = document.createElement('div');
  modal.id = 'icon-picker-modal';
  modal.className = 'icon-picker-modal';
  
  // Position near the clicked icon
  const rect = event.target.getBoundingClientRect();
  modal.style.left = (rect.right + 10) + 'px';
  modal.style.top = rect.top + 'px';
  
  modal.innerHTML = `
    <div class="icon-picker-header">Choose an icon</div>
    <div class="icon-picker-grid">
      ${projectIcons.map(icon => `
        <div class="icon-picker-item ${icon === project.icon ? 'selected' : ''}" 
             data-icon="${icon}"
             onclick="selectProjectIcon('${projectId}', '${icon}')">
          ${icon}
        </div>
      `).join('')}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeIconPicker(e) {
      if (!modal.contains(e.target)) {
        modal.remove();
        document.removeEventListener('click', closeIconPicker);
      }
    });
  }, 0);
  
  // Adjust position if it goes off screen
  const modalRect = modal.getBoundingClientRect();
  if (modalRect.right > window.innerWidth) {
    modal.style.left = (rect.left - modalRect.width - 10) + 'px';
  }
  if (modalRect.bottom > window.innerHeight) {
    modal.style.top = (window.innerHeight - modalRect.height - 10) + 'px';
  }
}

function selectProjectIcon(projectId, icon) {
  const project = fileManager.projects.find(p => p.id === projectId);
  if (project) {
    project.icon = icon;
    project.updatedAt = new Date().toISOString();
    fileManager.saveToStorage();
    fileManager.renderFileTree();
  }
  
  // Close the picker
  const modal = document.getElementById('icon-picker-modal');
  if (modal) {
    modal.remove();
  }
}

// ============================================
// AUTO-SAVE INTEGRATION
// ============================================

// Save current project on editor changes
const originalHandleEditorInput = typeof handleEditorInput === 'function' ? handleEditorInput : function() {};

if (typeof handleEditorInput === 'function') {
  const originalFunc = handleEditorInput;
  handleEditorInput = function() {
    originalFunc.apply(this, arguments);
    if (fileManager.currentProject && state.settings.autoSave) {
      fileManager.saveCurrentProject();
    }
  };
}

// Save before page unload
window.addEventListener('beforeunload', () => {
  if (fileManager.currentProject) {
    fileManager.saveCurrentProject();
  }
});

// Initialize file manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fileManager.init();
  });
} else {
  fileManager.init();
}

// Show add document context menu
function showAddDocumentMenu(event) {
  event.preventDefault();
  event.stopPropagation();

  const menuItems = [
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
      label: 'Create New Project',
      action: () => createNewProject()
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
      label: 'Import File',
      action: () => {
        // Create a hidden file input and trigger it
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.docx,.pdf';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        fileInput.onchange = (e) => {
          handleFileUpload(e);
          document.body.removeChild(fileInput);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
      }
    },
    {
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      label: 'Create Folder',
      action: () => createNewFolder()
    }
  ];

  // Position the context menu near the button
  const rect = event.target.closest('button').getBoundingClientRect();
  const x = rect.left;
  const y = rect.bottom + 5;

  fileManager.showContextMenu(x, y, menuItems);
}

// Toggle multi-select mode
function toggleMultiSelectMode() {
  const toolbar = document.getElementById('multi-select-toolbar');
  
  if (!toolbar) return;
  
  // If toolbar is hidden, show it and enable multi-select mode
  if (toolbar.style.display === 'none' || !toolbar.style.display) {
    toolbar.style.display = 'flex';
    const countDisplay = toolbar.querySelector('.selection-count');
    if (countDisplay) {
      countDisplay.textContent = fileManager.selectedProjects.size > 0 
        ? `${fileManager.selectedProjects.size} selected` 
        : 'Select files';
    }
    
    // Add visual indication that multi-select is active
    const sidebar = document.getElementById('file-sidebar');
    if (sidebar) {
      sidebar.classList.add('multi-select-active');
    }
  } else {
    // If toolbar is visible, hide it and clear selection
    fileManager.clearSelection();
    toolbar.style.display = 'none';
    
    // Remove visual indication
    const sidebar = document.getElementById('file-sidebar');
    if (sidebar) {
      sidebar.classList.remove('multi-select-active');
    }
  }
}

// ============================================
// EXPORT/IMPORT PROJECTS FUNCTIONALITY
// ============================================

function exportProjects() {
  try {
    // Get projects data from localStorage
    const projectsData = localStorage.getItem('fileManager_projects');
    const foldersData = localStorage.getItem('fileManager_folders');
    
    if (!projectsData) {
      notify('No projects found to export.');
      return;
    }

    // Parse the data
    const projects = JSON.parse(projectsData);
    const folders = foldersData ? JSON.parse(foldersData) : [];
    
    // Create export object with metadata
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projectCount: projects.length,
      folderCount: folders.length,
      projects: projects,
      folders: folders
    };
    
    // Create a blob with the data
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `citecount-projects-${new Date().toISOString().split('T')[0]}.json`;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    notify(`Successfully exported ${projects.length} project${projects.length !== 1 ? 's' : ''} and ${folders.length} folder${folders.length !== 1 ? 's' : ''}!`);
  } catch (error) {
    console.error('Export error:', error);
    notify(`Failed to export projects. Error: ${error.message}`);
  }
}

function importProjects(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  if (!file.name.endsWith('.json')) {
    notify('Invalid file type. Please select a JSON file.');
    event.target.value = ''; // Reset input
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      // Parse the imported data
      const importedData = JSON.parse(e.target.result);
      
      // Validate the data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid file format');
      }
      
      // Check if it's a valid CiteCount projects export
      if (!importedData.projects || !Array.isArray(importedData.projects)) {
        throw new Error('Invalid projects data. File does not contain valid CiteCount projects.');
      }
      
      // Validate each project has required fields
      const requiredProjectFields = ['id', 'name', 'content'];
      for (const project of importedData.projects) {
        const hasRequiredFields = requiredProjectFields.every(field => field in project);
        if (!hasRequiredFields) {
          throw new Error('Invalid project structure. Missing required fields.');
        }
      }
      
      // Validate folders if present
      if (importedData.folders && !Array.isArray(importedData.folders)) {
        throw new Error('Invalid folders data');
      }
      
      const projectCount = importedData.projects.length;
      const folderCount = importedData.folders ? importedData.folders.length : 0;
      
      // Show confirmation dialog
      showNotification(
        `Import ${projectCount} project${projectCount !== 1 ? 's' : ''} and ${folderCount} folder${folderCount !== 1 ? 's' : ''}?\n\nThis will add the imported projects to your existing projects. No existing projects will be deleted.`,
        true,
        () => {
          try {
            // Generate new IDs to avoid conflicts
            const idMapping = new Map();
            
            // Import folders first and create ID mapping
            const importedFolders = [];
            if (importedData.folders) {
              importedData.folders.forEach(folder => {
                const oldId = folder.id;
                const newId = fileManager.generateId();
                idMapping.set(oldId, newId);
                
                // Create new folder with new ID
                const newFolder = {
                  ...folder,
                  id: newId,
                  // Update parentId if it references another imported folder
                  parentId: folder.parentId && idMapping.has(folder.parentId) 
                    ? idMapping.get(folder.parentId) 
                    : folder.parentId
                };
                importedFolders.push(newFolder);
              });
            }
            
            // Import projects with new IDs
            const importedProjects = importedData.projects.map(project => {
              const newProject = {
                ...project,
                id: fileManager.generateId(),
                // Update folderId if it references an imported folder
                folderId: project.folderId && idMapping.has(project.folderId)
                  ? idMapping.get(project.folderId)
                  : null,
                // Update timestamps
                createdAt: project.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Ensure project has an icon
              if (!newProject.icon) {
                newProject.icon = fileManager.getRandomEmoji();
              }
              
              return newProject;
            });
            
            // Add imported folders to existing folders
            fileManager.folders.push(...importedFolders);
            
            // Add imported projects to existing projects
            fileManager.projects.push(...importedProjects);
            
            // Save to storage
            fileManager.saveToStorage();
            
            // Render the updated file tree
            fileManager.renderFileTree();
            
            // Reset file input
            event.target.value = '';
            
            notify(`Successfully imported ${projectCount} project${projectCount !== 1 ? 's' : ''} and ${folderCount} folder${folderCount !== 1 ? 's' : ''}!`);
          } catch (error) {
            console.error('Import processing error:', error);
            notify(`Failed to process imported data. Error: ${error.message}`);
            event.target.value = '';
          }
        },
        'confirmation'
      );
    } catch (error) {
      console.error('Import error:', error);
      notify(`Failed to import projects. ${error.message}`);
      event.target.value = ''; // Reset input
    }
  };
  
  reader.onerror = function() {
    notify('Failed to read file. Please try again.');
    event.target.value = ''; // Reset input
  };
  
  reader.readAsText(file);
}

// Global functions for storage quota modal
function closeStorageQuotaModal() {
  const modal = document.getElementById('storage-quota-modal');
  const overlay = document.getElementById('overlay-background');
  
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function updateStorageQuotaSelection() {
  const checkboxes = document.querySelectorAll('.storage-quota-checkbox:checked');
  const deleteBtn = document.getElementById('storage-quota-delete-btn');
  const countLabel = document.getElementById('storage-quota-selected-count');
  
  const count = checkboxes.length;
  
  if (countLabel) {
    countLabel.textContent = count === 0 ? '0 projects selected' : 
                             count === 1 ? '1 project selected' : 
                             `${count} projects selected`;
  }
  
  if (deleteBtn) {
    deleteBtn.disabled = count === 0;
  }
}

function deleteSelectedProjects() {
  const checkboxes = document.querySelectorAll('.storage-quota-checkbox:checked');
  
  if (checkboxes.length === 0) {
    if (typeof notify !== 'undefined') {
      notify('Please select at least one project to delete.', false, null, 'warning');
    } else {
      alert('Please select at least one project to delete.');
    }
    return;
  }
  
  // Confirm deletion
  const projectCount = checkboxes.length;
  const confirmMessage = projectCount === 1 ? 
    'Are you sure you want to delete this project? This action cannot be undone.' :
    `Are you sure you want to delete ${projectCount} projects? This action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Collect project IDs to delete
  const projectIdsToDelete = Array.from(checkboxes).map(cb => cb.dataset.projectId);
  
  // Delete projects
  projectIdsToDelete.forEach(projectId => {
    const projectIndex = fileManager.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      fileManager.projects.splice(projectIndex, 1);
    }
  });
  
  // If current project was deleted, switch to another one or create new
  if (projectIdsToDelete.includes(fileManager.currentProject)) {
    if (fileManager.projects.length > 0) {
      fileManager.currentProject = fileManager.projects[0].id;
      fileManager.loadProject(fileManager.currentProject);
    } else {
      fileManager.currentProject = null;
      const editor = document.getElementById('editor');
      if (editor) editor.innerHTML = '';
    }
  }
  
  // Try saving again - this should succeed now with freed space
  try {
    localStorage.setItem('fileManager_projects', JSON.stringify(fileManager.projects));
    localStorage.setItem('fileManager_folders', JSON.stringify(fileManager.folders));
    localStorage.setItem('fileManager_currentProject', fileManager.currentProject);
    
    // Success - close modal and show notification
    closeStorageQuotaModal();
    fileManager.renderFileTree();
    
    const deletedText = projectCount === 1 ? '1 project' : `${projectCount} projects`;
    if (typeof notify !== 'undefined') {
      notify(`Successfully deleted ${deletedText} and freed up storage space.`, false, null, 'success');
    } else {
      alert(`Successfully deleted ${deletedText} and freed up storage space.`);
    }
    
    // Create a new project if none exist
    if (fileManager.projects.length === 0) {
      fileManager.createProject('Untitled Project', true);
    }
  } catch (error) {
    // Still not enough space - show error and keep modal open
    if (typeof notify !== 'undefined') {
      notify('Not enough space freed. Please delete more projects.', false, null, 'error');
    } else {
      alert('Not enough space freed. Please delete more projects.');
    }
    
    // Refresh the modal to show updated list
    fileManager.showStorageQuotaModal();
  }
}

// Delete project from storage management settings
function deleteProjectFromStorage(projectId) {
  const project = fileManager.projects.find(p => p.id === projectId);
  if (!project) return;
  
  // Confirm deletion
  const confirmMessage = `Are you sure you want to delete "${project.name}"? This action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  // Delete the project
  const projectIndex = fileManager.projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    fileManager.projects.splice(projectIndex, 1);
  }
  
  // If current project was deleted, switch to another one or create new
  if (projectId === fileManager.currentProject) {
    if (fileManager.projects.length > 0) {
      fileManager.currentProject = fileManager.projects[0].id;
      fileManager.loadProject(fileManager.currentProject);
    } else {
      fileManager.currentProject = null;
      const editor = document.getElementById('editor');
      if (editor) editor.innerHTML = '';
    }
  }
  
  // Save changes
  fileManager.saveToStorage();
  fileManager.renderFileTree();
  
  // Update storage display
  fileManager.updateStorageDisplay();
  
  // Show notification
  if (typeof notify !== 'undefined') {
    notify(`"${project.name}" has been deleted.`, false, null, 'success');
  }
  
  // Create a new project if none exist
  if (fileManager.projects.length === 0) {
    fileManager.createProject('Untitled Project', true);
  }
}
