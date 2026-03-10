(function() {
  'use strict';

  const CUSTOM_TOOLS_STORAGE_KEY = 'citecount-custom-tools-v1';
  const CUSTOM_TOOLS_EVENT = 'customToolsChanged';
  const DEFAULT_PINNED_TOOLS = ['generateCitation', 'details'];
  const DEFAULT_CUSTOM_TOOL_ICON = '🧩';
  const BUILTIN_TOOL_IDS = [
    'citations',
    'generateCitation',
    'details',
    'dictionary',
    'thesaurus',
    'pomodoro',
    'translate',
    'notepad',
    'wordbank',
    'scientificCalculator',
    'graphingCalculator'
  ];

  function normalizeText(value, fallback = '') {
    return String(value == null ? fallback : value).trim();
  }

  function slugify(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  function normalizeIframeUrl(rawUrl) {
    const value = normalizeText(rawUrl);
    if (!value) {
      throw new Error('A valid iframe URL is required.');
    }

    let parsed;
    try {
      parsed = new URL(value, window.location.origin);
    } catch (error) {
      throw new Error('The iframe URL could not be parsed.');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http and https iframe URLs are supported.');
    }

    if (parsed.origin === window.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }

    return parsed.toString();
  }

  function readCustomTools() {
    try {
      const raw = localStorage.getItem(CUSTOM_TOOLS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((tool) => {
          try {
            const name = normalizeText(tool && tool.name);
            const description = normalizeText(tool && tool.description);
            const iframeUrl = normalizeIframeUrl(tool && tool.iframeUrl);
            const icon = normalizeText(tool && tool.icon, DEFAULT_CUSTOM_TOOL_ICON) || DEFAULT_CUSTOM_TOOL_ICON;
            const id = slugify(tool && tool.id) || slugify(name);

            if (!id || !name || !description) {
              return null;
            }

            return {
              id,
              name: name.slice(0, 64),
              description: description.slice(0, 160),
              iframeUrl,
              icon: icon.slice(0, 2),
              createdAt: typeof tool.createdAt === 'number' ? tool.createdAt : Date.now(),
              source: normalizeText(tool && tool.source, 'custom') || 'custom'
            };
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function writeCustomTools(tools, detail) {
    localStorage.setItem(CUSTOM_TOOLS_STORAGE_KEY, JSON.stringify(tools));
    sanitizePinnedTools();
    window.dispatchEvent(new CustomEvent(CUSTOM_TOOLS_EVENT, {
      detail: detail || { source: 'registry' }
    }));
  }

  function sanitizePinnedTools() {
    const customToolIds = new Set(readCustomTools().map((tool) => tool.id));
    const validIds = new Set(BUILTIN_TOOL_IDS.filter((id) => id !== 'citations'));
    customToolIds.forEach((id) => validIds.add(id));

    let storedPinned;
    try {
      storedPinned = JSON.parse(localStorage.getItem('pinnedTools') || JSON.stringify(DEFAULT_PINNED_TOOLS));
    } catch (error) {
      storedPinned = [...DEFAULT_PINNED_TOOLS];
    }

    const sanitized = [];
    (Array.isArray(storedPinned) ? storedPinned : DEFAULT_PINNED_TOOLS).forEach((toolId) => {
      if (validIds.has(toolId) && !sanitized.includes(toolId)) {
        sanitized.push(toolId);
      }
    });

    DEFAULT_PINNED_TOOLS.forEach((toolId) => {
      if (sanitized.length < 2 && !sanitized.includes(toolId)) {
        sanitized.push(toolId);
      }
    });

    const finalPinned = sanitized.slice(0, 2);
    localStorage.setItem('pinnedTools', JSON.stringify(finalPinned));
    return finalPinned;
  }

  function buildToolId(name, existingTools, preferredId) {
    const existingIds = new Set(existingTools.map((tool) => tool.id));
    const baseId = slugify(preferredId) || slugify(name) || 'custom-tool';
    let nextId = baseId;
    let suffix = 2;

    while (existingIds.has(nextId) && nextId !== preferredId) {
      nextId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    return nextId;
  }

  function normalizeIncomingTool(input, existingTools) {
    const name = normalizeText(input && input.name);
    const description = normalizeText(input && input.description);
    const iframeUrl = normalizeIframeUrl(input && input.iframeUrl);
    const icon = normalizeText(input && input.icon, DEFAULT_CUSTOM_TOOL_ICON) || DEFAULT_CUSTOM_TOOL_ICON;

    if (!name) {
      throw new Error('Tool name is required.');
    }

    if (!description) {
      throw new Error('A short description is required.');
    }

    const id = buildToolId(name, existingTools, normalizeText(input && input.id));

    return {
      id,
      name: name.slice(0, 64),
      description: description.slice(0, 160),
      iframeUrl,
      icon: icon.slice(0, 2),
      createdAt: Date.now(),
      source: normalizeText(input && input.source, 'custom') || 'custom'
    };
  }

  function upsertCustomTool(input) {
    const currentTools = readCustomTools();
    const incomingId = normalizeText(input && input.id);
    const remainingTools = incomingId ? currentTools.filter((tool) => tool.id !== incomingId) : currentTools;
    const normalizedTool = normalizeIncomingTool({ ...input, id: incomingId }, remainingTools);
    const nextTools = [...remainingTools, normalizedTool].sort((left, right) => left.name.localeCompare(right.name));
    writeCustomTools(nextTools, { source: 'marketplace', action: 'upsert', tool: normalizedTool });
    return normalizedTool;
  }

  function removeCustomTool(toolId) {
    const nextTools = readCustomTools().filter((tool) => tool.id !== toolId);
    writeCustomTools(nextTools, { source: 'marketplace', action: 'remove', toolId });
  }

  function getCustomToolById(toolId) {
    return readCustomTools().find((tool) => tool.id === toolId) || null;
  }

  function getMergedTools(baseTools) {
    const builtIns = Array.isArray(baseTools) ? baseTools.map((tool) => ({ ...tool })) : [];
    const customTools = readCustomTools().map((tool) => ({
      id: tool.id,
      name: tool.name,
      icon: tool.icon || DEFAULT_CUSTOM_TOOL_ICON,
      description: tool.description,
      iframeUrl: tool.iframeUrl,
      source: tool.source || 'custom'
    }));
    return [...builtIns, ...customTools];
  }

  function getToolDisplayMeta(toolId, baseTools) {
    return getMergedTools(baseTools).find((tool) => tool.id === toolId) || null;
  }

  function openToolsMarketplaceModal() {
    const modal = document.getElementById('tools-marketplace-modal');
    if (!modal) {
      return;
    }

    modal.style.display = 'flex';
    document.addEventListener('keydown', handleMarketplaceEscape);
  }

  function closeToolsMarketplaceModal() {
    const modal = document.getElementById('tools-marketplace-modal');
    if (!modal) {
      return;
    }

    modal.style.display = 'none';
    document.removeEventListener('keydown', handleMarketplaceEscape);
  }

  function handleMarketplaceEscape(event) {
    if (event.key === 'Escape') {
      closeToolsMarketplaceModal();
    }
  }

  function handleMarketplaceMessage(event) {
    if (event.origin !== window.location.origin) {
      return;
    }

    const data = event.data || {};
    if (!data.type || typeof data.type !== 'string') {
      return;
    }

    try {
      if (data.type === 'citecount:marketplace-upsert-tool') {
        const tool = upsertCustomTool(data.payload || {});
        if (typeof window.updateToolsDisplay === 'function') {
          window.updateToolsDisplay();
        }
        if (typeof window.updatePinnedTabLabels === 'function') {
          window.updatePinnedTabLabels();
        }
        if (typeof window.notify === 'function') {
          window.notify(`${tool.name} was added to More Tools.`);
        }
      }

      if (data.type === 'citecount:marketplace-remove-tool') {
        const toolId = normalizeText(data.payload && data.payload.id);
        if (!toolId) {
          return;
        }
        removeCustomTool(toolId);
        if (typeof window.updateToolsDisplay === 'function') {
          window.updateToolsDisplay();
        }
        if (typeof window.updatePinnedTabLabels === 'function') {
          window.updatePinnedTabLabels();
        }
        if (typeof window.notify === 'function') {
          window.notify('Custom tool removed.');
        }
      }
    } catch (error) {
      if (typeof window.notify === 'function') {
        window.notify(error.message || 'Unable to update tools marketplace.', true);
      }
    }
  }

  window.addEventListener('message', handleMarketplaceMessage);
  window.addEventListener('storage', (event) => {
    if (event.key === CUSTOM_TOOLS_STORAGE_KEY) {
      sanitizePinnedTools();
      window.dispatchEvent(new CustomEvent(CUSTOM_TOOLS_EVENT, {
        detail: { source: 'storage', action: 'sync' }
      }));
    }
  });

  sanitizePinnedTools();

  window.CUSTOM_TOOLS_STORAGE_KEY = CUSTOM_TOOLS_STORAGE_KEY;
  window.getCustomTools = readCustomTools;
  window.getCustomToolById = getCustomToolById;
  window.getMergedMarketplaceTools = getMergedTools;
  window.getToolDisplayMeta = getToolDisplayMeta;
  window.openToolsMarketplaceModal = openToolsMarketplaceModal;
  window.closeToolsMarketplaceModal = closeToolsMarketplaceModal;
  window.upsertCustomTool = upsertCustomTool;
  window.removeCustomTool = removeCustomTool;
  window.sanitizePinnedTools = sanitizePinnedTools;
})();