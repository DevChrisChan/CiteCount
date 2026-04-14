let isExporting = false;
let latestExportedPreviewUrl = '';
let currentDownloadProgress = 0;

function openDownloadModal() {
  const modal = document.getElementById('download-modal');
  const background = document.getElementById('overlay-background');
  const filenameInput = document.getElementById('download-filename');

  if (!modal || !background) return;

  if (filenameInput) {
    filenameInput.value = getDefaultExportFilename();
  }

  // Reset the format selector to PDF
  const formatSelect = document.getElementById('download-format');
  if (formatSelect) {
    formatSelect.value = 'pdf';
  }

  // Clear stored states to reset to defaults
  updateDownloadFormatOptions.previousStates = {
    'download-preserve-fonts': true,
    'download-preserve-styles': true,
    'download-include-highlights': true
  };

  // Reset checkboxes to default enabled state when opening
  const preserveFonts = document.getElementById('download-preserve-fonts');
  const preserveStyles = document.getElementById('download-preserve-styles');
  const includeHighlights = document.getElementById('download-include-highlights');
  
  if (preserveFonts) {
    preserveFonts.checked = true;
    preserveFonts.disabled = false;
  }
  if (preserveStyles) {
    preserveStyles.checked = true;
    preserveStyles.disabled = false;
  }
  if (includeHighlights) {
    includeHighlights.checked = true;
    includeHighlights.disabled = false;
  }

  setupDownloadFilenameValidation();
  updateDownloadFilenameValidation();
  resetDownloadProgressUi();

  modal.style.display = 'flex';
  background.style.display = 'block';
  updateDownloadFormatOptions();
}

function closeDownloadModal() {
  if (isExporting) {
    return;
  }

  const modal = document.getElementById('download-modal');
  const background = document.getElementById('overlay-background');
  if (modal) {
    modal.style.display = 'none';
  }
  if (background) {
    background.style.display = 'none';
  }
}

function setDownloadControlsDisabled(disabled) {
  const modal = document.getElementById('download-modal');
  if (!modal) return;

  const controls = modal.querySelectorAll('input, select, button');
  controls.forEach((control) => {
    control.disabled = disabled;
  });
}

function setDownloadModalView(view) {
  const configView = document.getElementById('download-config-view');
  const progressView = document.getElementById('download-progress-view');
  const defaultFooter = document.getElementById('download-modal-footer-default');
  const progressFooter = document.getElementById('download-modal-footer-progress');

  const showProgress = view === 'progress';

  if (configView) {
    configView.style.display = showProgress ? 'none' : 'block';
  }
  if (progressView) {
    progressView.style.display = showProgress ? 'block' : 'none';
  }
  if (defaultFooter) {
    defaultFooter.style.display = showProgress ? 'none' : 'flex';
  }
  if (progressFooter) {
    progressFooter.style.display = showProgress ? 'flex' : 'none';
  }
}

function resetDownloadProgressUi() {
  const progressFill = document.getElementById('download-progress-fill');
  const progressStatus = document.getElementById('download-progress-status');
  const progressPercent = document.getElementById('download-progress-percent');
  const progressTrack = document.querySelector('.download-progress-track');
  const doneButton = document.getElementById('download-done-btn');

  currentDownloadProgress = 0;

  setDownloadModalView('config');
  if (progressFill) {
    progressFill.style.width = '0%';
  }
  if (progressStatus) {
    progressStatus.textContent = 'Preparing export...';
  }
  if (progressPercent) {
    progressPercent.textContent = '0%';
  }
  if (progressTrack) {
    progressTrack.setAttribute('aria-valuenow', '0');
  }
  setPreviewButtonVisible(false);
  if (doneButton) {
    doneButton.disabled = true;
  }
}

function updateDownloadProgress(percent, status) {
  const progressFill = document.getElementById('download-progress-fill');
  const progressStatus = document.getElementById('download-progress-status');
  const progressPercent = document.getElementById('download-progress-percent');
  const progressTrack = document.querySelector('.download-progress-track');
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  setDownloadModalView('progress');
  if (progressFill) {
    progressFill.style.width = `${safePercent}%`;
  }
  if (progressStatus && status) {
    progressStatus.textContent = status;
  }
  if (progressPercent) {
    progressPercent.textContent = `${safePercent}%`;
  }
  if (progressTrack) {
    progressTrack.setAttribute('aria-valuenow', String(safePercent));
  }
}

function setPreviewButtonVisible(visible) {
  const previewButton = document.getElementById('download-preview-btn');
  if (!previewButton) return;
  previewButton.disabled = !visible;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateProgressTo(target, status, stepDelay = 16) {
  const safeTarget = Math.max(0, Math.min(100, Math.round(target)));

  while (currentDownloadProgress < safeTarget) {
    currentDownloadProgress += 1;
    updateDownloadProgress(currentDownloadProgress, status);
    await sleep(stepDelay);
  }

  updateDownloadProgress(currentDownloadProgress, status);
}

async function runTimedProgressStep(target, status, minDurationMs, task) {
  const taskPromise = typeof task === 'function' ? task() : Promise.resolve();
  const animationPromise = animateProgressTo(target, status);
  const delayPromise = sleep(minDurationMs);
  await Promise.all([taskPromise, animationPromise, delayPromise]);
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function openExportPdfPreview() {
  if (!latestExportedPreviewUrl) {
    notify('No PDF available to preview yet.', false, null, 'warning');
    return;
  }

  const previewModal = document.getElementById('pdf-preview-modal');
  const previewFrame = document.getElementById('pdf-preview-frame');
  if (!previewModal || !previewFrame) {
    return;
  }

  previewFrame.src = latestExportedPreviewUrl;
  previewModal.style.display = 'flex';
}

function updateLatestPreview(content, mimeType) {
  if (latestExportedPreviewUrl) {
    URL.revokeObjectURL(latestExportedPreviewUrl);
  }

  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType });

  latestExportedPreviewUrl = URL.createObjectURL(blob);
}

function closePdfPreviewModal() {
  const previewModal = document.getElementById('pdf-preview-modal');
  const previewFrame = document.getElementById('pdf-preview-frame');

  if (previewFrame) {
    previewFrame.src = 'about:blank';
  }
  if (previewModal) {
    previewModal.style.display = 'none';
  }
}

function setupDownloadFilenameValidation() {
  const filenameInput = document.getElementById('download-filename');
  const errorEl = document.getElementById('download-filename-error');

  if (!filenameInput || !errorEl || filenameInput.dataset.validationBound === 'true') {
    return;
  }

  filenameInput.dataset.validationBound = 'true';
  filenameInput.addEventListener('input', updateDownloadFilenameValidation);
}

function updateDownloadFilenameValidation() {
  const filenameInput = document.getElementById('download-filename');
  const errorEl = document.getElementById('download-filename-error');

  if (!filenameInput || !errorEl) return;

  const value = filenameInput.value || '';
  const invalidChar = findInvalidFilenameChar(value);

  if (!invalidChar) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    return;
  }

  const displayChar = formatInvalidFilenameChar(invalidChar);
  errorEl.textContent = `Invalid character '${displayChar}'`;
  errorEl.style.display = 'block';
}

function findInvalidFilenameChar(value) {
  const invalidRegex = /[<>:"/\\|?*\x00-\x1F]/;

  for (let i = 0; i < value.length; i += 1) {
    if (invalidRegex.test(value[i])) {
      return value[i];
    }
  }

  return '';
}

function formatInvalidFilenameChar(char) {
  if (!char) return '';

  const code = char.codePointAt(0);
  if (code <= 0x1F) {
    return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  }

  return char;
}

function updateDownloadFormatOptions() {
  const formatSelect = document.getElementById('download-format');
  const noteEl = document.getElementById('download-format-note');
  const preserveFonts = document.getElementById('download-preserve-fonts');
  const preserveStyles = document.getElementById('download-preserve-styles');
  const includeHighlights = document.getElementById('download-include-highlights');

  if (!formatSelect || !noteEl || !preserveFonts || !preserveStyles || !includeHighlights) return;

  // Store previous states before any changes
  if (!updateDownloadFormatOptions.previousStates) {
    updateDownloadFormatOptions.previousStates = {
      'download-preserve-fonts': true,
      'download-preserve-styles': true,
      'download-include-highlights': true
    };
  }

  const toggleOption = (input, enabled) => {
    const stateName = input.id;
    
    if (!enabled) {
      // Store current state before disabling
      updateDownloadFormatOptions.previousStates[stateName] = input.checked;
      input.disabled = true;
      input.checked = false;
    } else {
      // Restore previous state when enabling
      input.disabled = false;
      input.checked = updateDownloadFormatOptions.previousStates[stateName];
    }
    
    const label = input.closest('.download-option');
    if (label) {
      label.classList.toggle('disabled', !enabled);
    }
  };

  if (formatSelect.value === 'txt') {
    toggleOption(preserveFonts, false);
    toggleOption(preserveStyles, false);
    toggleOption(includeHighlights, false);
    noteEl.textContent = 'Text files export plain text only. Styling and highlights are not available.';
  } else if (formatSelect.value === 'pdf') {
    toggleOption(preserveFonts, true);
    toggleOption(preserveStyles, true);
    toggleOption(includeHighlights, true);
    noteEl.textContent = 'PDF exports selectable text. All stylings are preserved.';
  } else {
    toggleOption(preserveFonts, true);
    toggleOption(preserveStyles, true);
    toggleOption(includeHighlights, true);
    noteEl.textContent = formatSelect.value === 'html'
      ? 'HTML preserves styling and can be opened in browsers or Word.'
      : 'PDF renders your content for printing and sharing.';
  }

  if (formatSelect.value !== 'pdf') {
    setPreviewButtonVisible(false);
  }
}

async function downloadEditorContent() {
  if (isExporting) {
    return;
  }

  const editor = document.getElementById('editor');
  const formatSelect = document.getElementById('download-format');
  const filenameInput = document.getElementById('download-filename');
  const preserveFonts = document.getElementById('download-preserve-fonts');
  const preserveStyles = document.getElementById('download-preserve-styles');
  const includeHighlights = document.getElementById('download-include-highlights');

  if (!editor || !formatSelect) return;

  const rawText = editor.innerText.trim();
  if (!rawText) {
    notify('No text to download!', false, null, 'warning');
    return;
  }

  const format = formatSelect.value;
  const baseName = sanitizeFilename(filenameInput && filenameInput.value
    ? filenameInput.value
    : getDefaultExportFilename());
  const filename = baseName || 'CiteCount-Export';

  isExporting = true;
  setDownloadControlsDisabled(true);
  setDownloadModalView('progress');
  setPreviewButtonVisible(false);

  try {
    if (format === 'txt') {
      await runTimedProgressStep(25, 'Preparing text export...', 280, null);
      await runTimedProgressStep(70, 'Packaging TXT file...', 320, null);
      await runTimedProgressStep(100, 'Export complete', 380, () => {
        downloadBlob(rawText, 'text/plain;charset=utf-8', `${filename}.txt`);
      });
      updateLatestPreview(rawText, 'text/plain;charset=utf-8');
      setPreviewButtonVisible(true);
      notify('Downloaded as TXT.', false, null, 'success');
      return;
    }
    
    const exportOptions = {
      preserveFonts: preserveFonts ? preserveFonts.checked : true,
      preserveStyles: preserveStyles ? preserveStyles.checked : true,
      includeHighlights: includeHighlights ? includeHighlights.checked : true
    };

    if (format === 'html') {
      await runTimedProgressStep(25, 'Preparing HTML export...', 280, null);
      const html = buildExportHtml(exportOptions);
      await runTimedProgressStep(68, 'Packaging HTML file...', 320, null);
      await runTimedProgressStep(100, 'Export complete', 380, () => {
        downloadBlob(html, 'text/html;charset=utf-8', `${filename}.html`);
      });
      updateLatestPreview(html, 'text/html;charset=utf-8');
      setPreviewButtonVisible(true);
      notify('Downloaded as HTML.', false, null, 'success');
      return;
    }

    await exportToPdf(exportOptions, filename);
  } finally {
    isExporting = false;
    setDownloadControlsDisabled(false);
    const doneButton = document.getElementById('download-done-btn');
    if (doneButton) {
      doneButton.disabled = false;
    }
  }
}

function sanitizeFilename(name) {
  if (!name) return '';
  const sanitized = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
  return sanitized || '';
}

function getDefaultExportFilename() {
  let name = 'CiteCount-Export';

  if (typeof fileManager !== 'undefined' && fileManager.currentProject && Array.isArray(fileManager.projects)) {
    const project = fileManager.projects.find((item) => item.id === fileManager.currentProject);
    if (project && project.name) {
      name = project.name;
    }
  }

  return sanitizeFilename(name) || 'CiteCount-Export';
}

function downloadBlob(content, mimeType, filename) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildExportHtml(options) {
  const markup = buildExportMarkup(options);
  return `<!doctype html><html><head><meta charset="utf-8"><title>CiteCount Export</title><style>${markup.styles}</style></head><body>${markup.body}</body></html>`;
}

function buildExportMarkup(options) {
  const editor = document.getElementById('editor');
  const baseContent = editor ? editor.innerHTML : '';
  const plainText = editor ? editor.innerText : '';

  let contentHtml = '';

  if (!options.preserveStyles) {
    contentHtml = escapeHtml(plainText).replace(/\n/g, '<br>');
  } else if (options.includeHighlights) {
    contentHtml = highlightCitations(baseContent);
  } else {
    contentHtml = baseContent;
  }

  const fontStyle = options.preserveFonts
    ? `font-family: ${state.settings.fontFamily}; font-size: ${state.settings.fontSize}px;`
    : '';

  const styles = `
    :root { --highlight-included: rgba(255, 0, 0, 0.3); --highlight-excluded: rgba(0, 207, 0, 0.3); }
    body { margin: 0; padding: 32px; background: #ffffff; color: #111111; }
    .export-content { ${fontStyle} line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .citation-highlight { border-radius: 4px; text-decoration: underline; padding: 0 1px; }
    .citation-highlight.included { background: var(--highlight-included); }
    .citation-highlight.excluded { background: var(--highlight-excluded); }
  `;

  const body = `<div class="export-content">${contentHtml}</div>`;

  return { styles, body };
}

function loadExportScripts() {
  if (window.jspdf) {
    return Promise.resolve();
  }

  const scripts = ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];

  return new Promise((resolve, reject) => {
    let loaded = 0;
    scripts.forEach((src) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        loaded += 1;
        if (loaded === scripts.length) {
          resolve();
        }
      };
      script.onerror = () => reject(new Error('Failed to load export scripts'));
      document.body.appendChild(script);
    });
  });
}

async function exportToPdf(options, filename) {
  try {
    setDownloadModalView('progress');
    await runTimedProgressStep(10, 'Loading PDF engine...', 420, async () => {
      await waitForPaint();
      await loadExportScripts();
    });

    if (!window.jspdf || !window.jspdf.jsPDF) {
      notify('PDF export is unavailable. Please try HTML or TXT.', false, null, 'error');
      return;
    }

    await runTimedProgressStep(24, 'Preparing content...', 320, () => waitForPaint());

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'letter');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;

    const fontConfig = getPdfFontConfig(options.preserveFonts);
    const textData = getPdfTextSegments(options.preserveStyles);
    const highlightRanges = options.includeHighlights
      ? getCitationHighlightRanges(textData.text)
      : [];

    await runTimedProgressStep(46, 'Building PDF layout...', 300, () => waitForPaint());

    const lines = buildPdfLines(textData.segments, pdf, fontConfig, maxWidth);
    const lineHeight = fontConfig.size * 1.4;
    const totalLines = Math.max(lines.length, 1);

    let cursorY = margin + fontConfig.size;

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (cursorY + lineHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin + fontConfig.size;
      }

      let cursorX = margin;
      line.segments.forEach((segment) => {
        setPdfFontStyle(pdf, fontConfig.family, segment.bold, segment.italic, fontConfig.size);

        if (highlightRanges.length > 0) {
          renderPdfHighlights(pdf, segment, cursorX, cursorY, fontConfig.size, lineHeight, highlightRanges);
        }

        pdf.text(segment.text, cursorX, cursorY);
        cursorX += pdf.getTextWidth(segment.text);
      });

      cursorY += lineHeight;

      if (index % 24 === 0 || index === totalLines - 1) {
        const renderProgress = 50 + Math.round((index / totalLines) * 40);
        await animateProgressTo(renderProgress, 'Rendering pages...', 8);
      }
    }

    await runTimedProgressStep(94, 'Finalizing PDF...', 320, null);
    const pdfBlob = pdf.output('blob');

    downloadBlob(pdfBlob, 'application/pdf', `${filename}.pdf`);

    updateLatestPreview(pdfBlob, 'application/pdf');

    await animateProgressTo(100, 'Export complete', 14);
    setPreviewButtonVisible(true);
    notify('Downloaded as PDF.', false, null, 'success');
  } catch (error) {
    console.error('PDF export error:', error);
    updateDownloadProgress(0, 'Export failed');
    notify('PDF export failed. Please try HTML or TXT.', false, null, 'error');
  }
}

function getPdfFontConfig(preserveFonts) {
  const defaultSize = state.settings.fontSize || 12;
  const size = Math.max(8, Math.min(defaultSize, 24));
  const family = preserveFonts
    ? mapFontFamilyToPdf(state.settings.fontFamily)
    : 'helvetica';
  return { family, size };
}

function mapFontFamilyToPdf(fontFamily) {
  if (!fontFamily) return 'helvetica';
  const normalized = fontFamily.toLowerCase();
  if (normalized.includes('times')) return 'times';
  if (normalized.includes('georgia')) return 'times';
  if (normalized.includes('courier')) return 'courier';
  if (normalized.includes('monospace')) return 'courier';
  return 'helvetica';
}

function setPdfFontStyle(pdf, family, bold, italic, size) {
  let style = 'normal';
  if (bold && italic) {
    style = 'bolditalic';
  } else if (bold) {
    style = 'bold';
  } else if (italic) {
    style = 'italic';
  }
  pdf.setFont(family, style);
  pdf.setFontSize(size);
}

function getPdfTextSegments(preserveStyles) {
  const editor = document.getElementById('editor');
  if (!editor) return { text: '', segments: [] };

  if (!preserveStyles) {
    const plainText = editor.innerText || '';
    return {
      text: plainText,
      segments: [{ text: plainText, bold: false, italic: false, startIndex: 0 }]
    };
  }

  const segments = [];
  const blockTags = new Set(['DIV', 'P', 'LI', 'TR']);

  const traverse = (node, style) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue) {
        segments.push({ text: node.nodeValue, bold: style.bold, italic: style.italic });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;
    if (tag === 'BR') {
      segments.push({ text: '\n', bold: style.bold, italic: style.italic });
      return;
    }

    const nextStyle = {
      bold: style.bold || tag === 'B' || tag === 'STRONG',
      italic: style.italic || tag === 'I' || tag === 'EM'
    };

    Array.from(node.childNodes).forEach((child) => traverse(child, nextStyle));

    if (blockTags.has(tag)) {
      segments.push({ text: '\n', bold: style.bold, italic: style.italic });
    }
  };

  traverse(editor, { bold: false, italic: false });

  const merged = [];
  segments.forEach((segment) => {
    if (!segment.text) return;
    const last = merged[merged.length - 1];
    if (last && last.bold === segment.bold && last.italic === segment.italic) {
      last.text += segment.text;
    } else {
      merged.push({ text: segment.text, bold: segment.bold, italic: segment.italic });
    }
  });

  let text = '';
  merged.forEach((segment) => {
    segment.startIndex = text.length;
    text += segment.text;
  });

  return { text, segments: merged };
}

function getCitationHighlightRanges(text) {
  const ranges = [];
  const regex = /[()（）][^()（）]*[()（）]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function buildPdfLines(segments, pdf, fontConfig, maxWidth) {
  const lines = [];
  let currentLine = { segments: [] };
  let currentWidth = 0;

  const pushLine = () => {
    lines.push(currentLine);
    currentLine = { segments: [] };
    currentWidth = 0;
  };

  const addSegmentToLine = (segment, width) => {
    currentLine.segments.push(segment);
    currentWidth += width;
  };

  segments.forEach((segment) => {
    const text = segment.text || '';
    const parts = text.split('\n');
    let pointer = 0;

    parts.forEach((part, partIndex) => {
      const tokens = part.split(/(\s+)/);
      let partOffset = 0;

      tokens.forEach((token) => {
        if (!token) return;
        const isSpace = /^\s+$/.test(token);
        const tokenStart = segment.startIndex + pointer + partOffset;

        setPdfFontStyle(pdf, fontConfig.family, segment.bold, segment.italic, fontConfig.size);
        const tokenWidth = pdf.getTextWidth(token);

        if (isSpace && currentWidth === 0) {
          partOffset += token.length;
          return;
        }

        if (!isSpace && currentWidth + tokenWidth > maxWidth && currentWidth > 0) {
          pushLine();
        }

        if (tokenWidth > maxWidth) {
          const chunks = splitLongToken(token, pdf, fontConfig, maxWidth);
          let chunkOffset = 0;
          chunks.forEach((chunk) => {
            const chunkWidth = pdf.getTextWidth(chunk);
            if (currentWidth + chunkWidth > maxWidth && currentWidth > 0) {
              pushLine();
            }
            addSegmentToLine({
              text: chunk,
              bold: segment.bold,
              italic: segment.italic,
              startIndex: tokenStart + chunkOffset
            }, chunkWidth);
            chunkOffset += chunk.length;
          });
          partOffset += token.length;
          return;
        }

        addSegmentToLine({
          text: token,
          bold: segment.bold,
          italic: segment.italic,
          startIndex: tokenStart
        }, tokenWidth);

        partOffset += token.length;
      });

      pointer += part.length;
      if (partIndex < parts.length - 1) {
        pushLine();
        pointer += 1;
      }
    });
  });

  lines.push(currentLine);
  return lines;
}

function splitLongToken(token, pdf, fontConfig, maxWidth) {
  const chunks = [];
  let current = '';

  for (let i = 0; i < token.length; i += 1) {
    const next = current + token[i];
    const width = pdf.getTextWidth(next);
    if (width > maxWidth && current) {
      chunks.push(current);
      current = token[i];
    } else {
      current = next;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function renderPdfHighlights(pdf, segment, startX, baselineY, fontSize, lineHeight, ranges) {
  const segmentStart = segment.startIndex;
  const segmentEnd = segment.startIndex + segment.text.length;

  ranges.forEach((range) => {
    if (range.end <= segmentStart || range.start >= segmentEnd) {
      return;
    }

    const overlapStart = Math.max(range.start, segmentStart);
    const overlapEnd = Math.min(range.end, segmentEnd);
    const startOffset = overlapStart - segmentStart;
    const endOffset = overlapEnd - segmentStart;

    const prefix = segment.text.slice(0, startOffset);
    const highlightText = segment.text.slice(startOffset, endOffset);

    const prefixWidth = pdf.getTextWidth(prefix);
    const highlightWidth = pdf.getTextWidth(highlightText);

    const rectX = startX + prefixWidth;
    const rectY = baselineY - fontSize * 0.85;

    pdf.setFillColor(255, 243, 128);
    pdf.rect(rectX, rectY, highlightWidth, lineHeight, 'F');
  });
}
