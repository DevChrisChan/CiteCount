let isImportCancelled = false;
let importStartTime = null;
let fileProcessingTimes = [];

function setupResizablePanels() {
  const gutter = document.getElementById('gutter');
  const editorPanel = document.getElementById('editor-panel');
  const citationsPanel = document.getElementById('citations-panel');
  const split = document.querySelector('.split');
  let isResizing = false;
  let startX, startWidthEditor, startWidthCitations;
  let resizeOverlay = null;
  let previousBodyUserSelect = '';

  function addResizeOverlay() {
    if (resizeOverlay) return;
    resizeOverlay = document.createElement('div');
    resizeOverlay.style.position = 'fixed';
    resizeOverlay.style.inset = '0';
    resizeOverlay.style.cursor = 'ew-resize';
    resizeOverlay.style.zIndex = '9999';
    resizeOverlay.style.background = 'transparent';
    resizeOverlay.style.pointerEvents = 'auto';
    resizeOverlay.style.userSelect = 'none';
    document.body.appendChild(resizeOverlay);
  }

  function removeResizeOverlay() {
    if (!resizeOverlay) return;
    resizeOverlay.remove();
    resizeOverlay = null;
  }

  function updatePanelFlex() {
    const isMobile = window.innerWidth < 1024;
    split.style.flexDirection = isMobile ? 'column' : 'row';
    
    if (isMobile) {
      editorPanel.style.flex = '1';
      citationsPanel.style.flex = '0';
      citationsPanel.classList.add('hidden');
      gutter.style.display = 'none';
    } else {
      split.style.flexDirection = 'row';
      const containerWidth = split.offsetWidth;
      const minWidth = 30;
      const maxWidth = 70;
      const baseWidth = Math.min(maxWidth, Math.max(minWidth, Math.floor(containerWidth * 0.5 / containerWidth * 100)));
      editorPanel.style.flex = `0 0 ${baseWidth}%`;
      citationsPanel.style.flex = `0 0 ${100 - baseWidth}%`;
      citationsPanel.classList.remove('hidden');
      gutter.style.display = 'block';
    }
  }

  function startResize(e) {
    if (window.innerWidth < 1024) return;
    isResizing = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    startWidthEditor = editorPanel.offsetWidth;
    startWidthCitations = citationsPanel.offsetWidth;
    addResizeOverlay();
    previousBodyUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    document.documentElement.style.cursor = 'ew-resize';
    e.preventDefault();
  }

  function handleResize(e) {
    if (!isResizing) return;
    if (e.type.includes('touch')) {
      e.preventDefault();
    }
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const container = document.querySelector('.split');
    const containerWidth = container.offsetWidth;
    const movementX = currentX - startX;
    const newEditorWidth = (startWidthEditor + movementX) / containerWidth * 100;
    const newCitationsWidth = 100 - newEditorWidth;
    const minWidth = 30;
    const maxWidth = 70;

    if (newEditorWidth >= minWidth && newEditorWidth <= maxWidth && 
        newCitationsWidth >= minWidth && newCitationsWidth <= maxWidth) {
      editorPanel.style.flex = `0 0 ${newEditorWidth}%`;
      citationsPanel.style.flex = `0 0 ${newCitationsWidth}%`;
      document.documentElement.style.cursor = 'ew-resize';
    } else if (newEditorWidth < minWidth) {
      document.documentElement.style.cursor = 'e-resize';
    } else if (newEditorWidth > maxWidth) {
      document.documentElement.style.cursor = 'w-resize';
    }
  }

  function stopResize() {
    isResizing = false;
    removeResizeOverlay();
    document.body.style.userSelect = previousBodyUserSelect;
    document.documentElement.style.cursor = '';
  }

  updatePanelFlex();
  window.addEventListener('resize', updatePanelFlex);

  gutter.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);

  gutter.addEventListener('touchstart', startResize);
  document.addEventListener('touchmove', handleResize, { passive: false });
  document.addEventListener('touchend', stopResize);
  document.addEventListener('touchcancel', stopResize);
}

function updateLayout() {
  const manageBtn = document.getElementById('manage-citations-btn');
  const editorContainer = document.querySelector('.editor-container');
  const split = document.querySelector('.split');
  const citationsPanel = document.getElementById('citations-panel');

  if (window.innerWidth < 1024) {
    manageBtn.style.display = 'block';
    editorContainer.style.flex = '1';
    split.style.flexDirection = 'column';
    citationsPanel.classList.add('hidden');
  } else {
    manageBtn.style.display = 'none';
    split.style.flexDirection = 'row';
    editorContainer.style.flex = '';
    citationsPanel.classList.remove('hidden');
    setupResizablePanels();
  }
  updateWordCountWithSelection();
  updateStatsMargin();
}

function setupDragAndDrop() {
  const dropOverlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  // Track dragenter/dragleave on window for full-screen detection
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    // Only show drop overlay for actual file drops, not sidebar item reordering
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      if (dropOverlay) {
        dropOverlay.style.display = 'flex';
      }
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    // Only show drop overlay for actual file drops, not sidebar item reordering
    if (e.dataTransfer.types.includes('Files')) {
      if (dropOverlay) {
        dropOverlay.style.display = 'flex';
      }
    }
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounter--;
      // Only hide when all drag events have left
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (dropOverlay) dropOverlay.style.display = 'none';
      }
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    if (dropOverlay) dropOverlay.style.display = 'none';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleMultipleFilesDrop(files);
    }
  });
}

function handleMultipleFilesDrop(files) {
  const fileArray = Array.from(files);
  const totalFiles = fileArray.length;
  
  // Show progress UI for all files (including single file)
  showFileImportProgress(totalFiles);
  processFilesSequentially(fileArray, 0, totalFiles);
}

function showFileImportProgress(totalFiles) {
  importStartTime = Date.now();
  fileProcessingTimes = [];
  
  const progressHTML = `
    <div id="file-import-progress" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
         background: var(--background-primary); border: 1px solid var(--border-primary); border-radius: 12px; 
         padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 10002; width: 500px; max-width: 90vw;">
      <h3 style="margin: 0 0 16px 0; font-size: 1.25rem; font-weight: 600;">Importing Files</h3>
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.875rem; color: var(--text-secondary);">
          <span id="progress-status" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 8px;">Processing files...</span>
          <span id="progress-count" style="flex-shrink: 0;">0 / ${totalFiles}</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--background-secondary); border-radius: 4px; overflow: hidden;">
          <div id="progress-bar-fill" style="width: 0%; height: 100%; background: #1F40AF; transition: width 0.3s ease;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
          <span id="time-elapsed">Elapsed: 0s</span>
          <span id="time-remaining">Estimated: --</span>
        </div>
      </div>
      <div id="file-import-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 16px; overflow-x: hidden;">
        <!-- File items will be added here -->
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="import-cancel-btn" onclick="cancelFileImport()" style="padding: 8px 16px; border-radius: 6px; background: transparent; 
                border: 1px solid var(--border-primary); cursor: pointer; font-size: 0.875rem;">Cancel</button>
        <button id="import-done-btn" onclick="closeFileImportProgress()" style="padding: 8px 16px; border-radius: 6px; 
                background: #1F40AF; color: white; border: none; cursor: pointer; font-size: 0.875rem; display: none;">Done</button>
      </div>
    </div>
    <div id="file-import-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
         background: rgba(0,0,0,0.5); z-index: 10001;" onclick="event.stopPropagation();"></div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = progressHTML;
  document.body.appendChild(tempDiv.firstElementChild);
  document.body.appendChild(tempDiv.lastElementChild);
}

function cancelFileImport() {
  isImportCancelled = true;
  const cancelBtn = document.getElementById('import-cancel-btn');
  if (cancelBtn) {
    cancelBtn.textContent = 'Cancelling...';
    cancelBtn.disabled = true;
  }
}

function closeFileImportProgress() {
  const progressEl = document.getElementById('file-import-progress');
  const overlayEl = document.getElementById('file-import-overlay');
  if (progressEl) progressEl.remove();
  if (overlayEl) overlayEl.remove();
  isImportCancelled = false;
  importStartTime = null;
  fileProcessingTimes = [];
}

function goToImportedFile(fileId) {
  // Get the project ID from the file item
  const fileItem = document.getElementById(fileId);
  if (!fileItem) return;
  
  const projectId = fileItem.dataset.projectId;
  if (!projectId) return;
  
  // Close the import progress modal
  closeFileImportProgress();
  
  // Load the project using fileManager
  if (typeof fileManager !== 'undefined' && fileManager.loadProject) {
    fileManager.loadProject(projectId);
    fileManager.currentProject = projectId;
    fileManager.renderFileTree();
  }
}

function addFileToImportList(fileName, status = 'pending', projectId = null) {
  const fileList = document.getElementById('file-import-list');
  if (!fileList) return;
  
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const statusIcon = {
    'pending': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/></svg>',
    'processing': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>',
    'success': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    'error': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };
  
  const fileItem = document.createElement('div');
  fileItem.id = fileId;
  fileItem.dataset.projectId = projectId || '';
  fileItem.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 6px; background: var(--background-secondary); margin-bottom: 8px;';
  
  const goToButtonHTML = projectId ? `
    <button onclick="goToImportedFile('${fileId}')" 
      style="flex-shrink: 0; padding: 4px 8px; background: #1F40AF; color: white; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.2s;"
      onmouseover="this.style.background='#1F40AF'" onmouseout="this.style.background='#1F40AF'" 
      title="Go to this file">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="display: inline; margin-right: 4px; vertical-align: -2px;">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Open
    </button>
  ` : '';
  
  fileItem.innerHTML = `
    <div class="file-status-icon" style="flex-shrink: 0;">${statusIcon[status]}</div>
    <div style="flex: 1; min-width: 0; overflow: hidden;">
      <div style="font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${fileName}">${fileName}</div>
      <div class="file-status-text" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">Waiting...</div>
    </div>
    ${goToButtonHTML}
  `;
  
  fileList.appendChild(fileItem);
  
  // Auto-scroll to the bottom to show the newly added file
  fileList.scrollTop = fileList.scrollHeight;
  
  return fileId;
}

function updateFileImportStatus(fileId, status, message = '') {
  const fileItem = document.getElementById(fileId);
  if (!fileItem) return;
  
  const statusIcon = {
    'pending': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.3"/></svg>',
    'processing': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" opacity="0.3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>',
    'success': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    'error': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  };
  
  const iconEl = fileItem.querySelector('.file-status-icon');
  const textEl = fileItem.querySelector('.file-status-text');
  
  if (iconEl) iconEl.innerHTML = statusIcon[status];
  if (textEl) {
    textEl.textContent = message || {
      'pending': 'Waiting...',
      'processing': 'Processing...',
      'success': 'Imported successfully',
      'error': 'Failed to import'
    }[status];
    
    if (status === 'error') {
      textEl.style.color = '#ef4444';
    } else if (status === 'success') {
      textEl.style.color = '#10b981';
    }
  }
}

function processFilesSequentially(files, currentIndex, totalFiles) {
  if (isImportCancelled) {
    updateProgressUI(currentIndex, totalFiles, 'Import cancelled');
    showImportDoneButton();
    notify('File import cancelled', false, null, 'warning');
    return;
  }
  
  if (currentIndex >= totalFiles) {
    updateProgressUI(totalFiles, totalFiles, 'All files processed');
    showImportDoneButton();
    return;
  }
  
  const file = files[currentIndex];
  const fileId = addFileToImportList(file.name);
  updateProgressUI(currentIndex, totalFiles, `Processing ${file.name}...`);
  
  // Update file status to processing
  updateFileImportStatus(fileId, 'processing', 'Processing...');
  
  // Process the file
  processFileWithProgress(file, fileId, (success, errorMessage, projectId) => {
    if (success) {
      // Update file item with projectId if available
      const fileItem = document.getElementById(fileId);
      if (fileItem && projectId) {
        fileItem.dataset.projectId = projectId;
        // Re-render the button HTML
        const button = fileItem.querySelector('button');
        if (!button) {
          const goToButtonHTML = `
            <button onclick="goToImportedFile('${fileId}')" 
              style="flex-shrink: 0; padding: 4px 8px; background: #1F40AF; color: white; border: none; border-radius: 4px; font-size: 0.75rem; cursor: pointer; transition: background 0.2s;"
              onmouseover="this.style.background='#1F40AF'" onmouseout="this.style.background='#1F40AF'" 
              title="Go to this file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="display: inline; margin-right: 4px; vertical-align: -2px;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open
            </button>
          `;
          const div = document.createElement('div');
          div.innerHTML = goToButtonHTML;
          fileItem.appendChild(div.firstElementChild);
        }
      }
      updateFileImportStatus(fileId, 'success', 'Imported successfully');
    } else {
      updateFileImportStatus(fileId, 'error', errorMessage || 'Failed to import');
    }
    
    // Update overall progress
    updateProgressUI(currentIndex + 1, totalFiles, success ? 
      `Imported ${file.name}` : `Failed to import ${file.name}`);
    
    // Process next file after a short delay
    setTimeout(() => {
      processFilesSequentially(files, currentIndex + 1, totalFiles);
    }, 300);
  });
}

function formatTime(seconds) {
  if (seconds < 60) {
    return Math.round(seconds) + 's';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function updateProgressUI(current, total, statusText) {
  const progressCount = document.getElementById('progress-count');
  const progressStatus = document.getElementById('progress-status');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const timeElapsed = document.getElementById('time-elapsed');
  const timeRemaining = document.getElementById('time-remaining');
  
  if (progressCount) progressCount.textContent = `${current} / ${total}`;
  if (progressStatus) progressStatus.textContent = statusText;
  if (progressBarFill) {
    const percentage = (current / total) * 100;
    progressBarFill.style.width = `${percentage}%`;
  }
  
  // Update elapsed time
  if (timeElapsed && importStartTime) {
    const elapsed = (Date.now() - importStartTime) / 1000;
    timeElapsed.textContent = `Elapsed: ${formatTime(elapsed)}`;
  }
  
  // Update estimated remaining time
  if (timeRemaining && current > 0 && current < total) {
    const elapsed = (Date.now() - importStartTime) / 1000;
    const avgTimePerFile = elapsed / current;
    const remainingFiles = total - current;
    const estimatedRemaining = avgTimePerFile * remainingFiles;
    timeRemaining.textContent = `Time remaining: About ${formatTime(estimatedRemaining)}`;
  } else if (timeRemaining && current >= total) {
    timeRemaining.textContent = '';
  }
}

function showImportDoneButton() {
  const cancelBtn = document.getElementById('import-cancel-btn');
  const doneBtn = document.getElementById('import-done-btn');
  
  if (cancelBtn) cancelBtn.style.display = 'none';
  if (doneBtn) doneBtn.style.display = 'block';
}

function updateStatsMargin() {
  const banner = document.getElementById('announcement-banner');
  const header = document.querySelector('header');
  const statsRow = document.querySelector('.stats-row');
  const bannerHeight = banner.style.display === 'none' ? 0 : banner.offsetHeight;
  const headerHeight = header.offsetHeight;
  statsRow.style.marginTop = `${bannerHeight + headerHeight + 10}px`;
}

window.addEventListener('resize', function () {
  const manageBtn = document.getElementById('manage-citations-btn');
  const editorContainer = document.querySelector('.editor-container');
  const split = document.querySelector('.split');
  const citationsPanel = document.getElementById('citations-panel');

  if (window.innerWidth < 1024) {
    manageBtn.style.display = 'block';
    editorContainer.style.flex = '1';
    split.style.flexDirection = 'column';
    citationsPanel.classList.add('hidden');
  } else {
    manageBtn.style.display = 'none';
    split.style.flexDirection = 'row';
    editorContainer.style.flex = '';
    citationsPanel.classList.remove('hidden');
    setupResizablePanels();
  }
  updateWordCountWithSelection();
  updateStatsMargin();
});
