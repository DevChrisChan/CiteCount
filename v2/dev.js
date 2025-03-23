document.addEventListener('DOMContentLoaded', () => {
    const devTools = document.getElementById('devToolsWindow');
    const header = document.getElementById('devToolsHeader');
    const resizeHandle = document.getElementById('resizeHandle');
    const closeBtn = document.getElementById('devToolsClose');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const consoleOutput = document.getElementById('consoleOutput');
    const errorsTable = document.getElementById('errorsTable').querySelector('tbody');
    const clearAllStorageBtn = document.getElementById('clearAllStorage');
    const clearAllCookiesBtn = document.getElementById('clearAllCookies');
    const disableAnalyticsCheckbox = document.getElementById('disableAnalytics');
    const grantPro = document.getElementById('grantPro');
    const disableDevModeCheckbox = document.getElementById('disableDevMode');
    const opacitySlider = document.getElementById('opacitySlider');
    const forceLightThemeBtn = document.getElementById('forceLightTheme');
    const forceDarkThemeBtn = document.getElementById('forceDarkTheme');
    const restartApp = document.getElementById('restartApp');
    const restartDebug = document.getElementById('restartDebug');
    const currentLocation = document.getElementById('currentLocation')

    currentLocation.textContent = window.location.href;

    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 150;

    // Mouse Events
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - devTools.offsetLeft;
        startY = e.clientY - devTools.offsetTop;
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = devTools.offsetWidth;
        startHeight = devTools.offsetHeight;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const maxX = window.innerWidth - devTools.offsetWidth;
            const maxY = window.innerHeight - devTools.offsetHeight;
            let newLeft = e.clientX - startX;
            let newTop = e.clientY - startY;

            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            devTools.style.left = newLeft + 'px';
            devTools.style.top = newTop + 'px';
        }
        if (isResizing) {
            let newWidth = startWidth + e.clientX - startX;
            let newHeight = startHeight + e.clientY - startY;

            newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, window.innerWidth - devTools.offsetLeft));
            newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, window.innerHeight - devTools.offsetTop));

            devTools.style.width = newWidth + 'px';
            devTools.style.height = newHeight + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
    });

    // Touch Events
    header.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX - devTools.offsetLeft;
        startY = touch.clientY - devTools.offsetTop;
        e.preventDefault();
    }, { passive: false });

    resizeHandle.addEventListener('touchstart', (e) => {
        isResizing = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startWidth = devTools.offsetWidth;
        startHeight = devTools.offsetHeight;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (isDragging) {
            const maxX = window.innerWidth - devTools.offsetWidth;
            const maxY = window.innerHeight - devTools.offsetHeight;
            let newLeft = touch.clientX - startX;
            let newTop = touch.clientY - startY;

            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));

            devTools.style.left = newLeft + 'px';
            devTools.style.top = newTop + 'px';
            e.preventDefault();
        }
        if (isResizing) {
            let newWidth = startWidth + touch.clientX - startX;
            let newHeight = startHeight + touch.clientY - startY;

            newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, window.innerWidth - devTools.offsetLeft));
            newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, window.innerHeight - devTools.offsetTop));

            devTools.style.width = newWidth + 'px';
            devTools.style.height = newHeight + 'px';
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        isDragging = false;
        isResizing = false;
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        devTools.style.display = 'none';
    });

    // Console override
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = function (...args) {
        const output = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');
        consoleOutput.textContent += output + '\n';
        originalConsoleLog.apply(console, args);
    };

    console.error = function (...args) {
        const output = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');
        consoleOutput.textContent += output + '\n';
        originalConsoleError.apply(console, args);
    };

    // Error handling
    window.onerror = function (message, source, lineno, colno, error) {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${new Date().toLocaleTimeString()}</td>
        <td>${message} (${source}:${lineno}:${colno})</td>
      `;
        errorsTable.appendChild(row);
    };

    // Tab functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            updateTabContent(tabId);
        });
    });

    // JSON table generator
    function createJsonTable(obj) {
        const table = document.createElement('table');
        table.className = 'nested-table';
        const thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>Key</th><th>Value</th></tr>';
        const tbody = document.createElement('tbody');

        for (let [key, value] of Object.entries(obj)) {
            const row = document.createElement('tr');
            let valueCell;

            if (typeof value === 'object' && value !== null) {
                valueCell = createJsonTable(value);
            } else {
                valueCell = document.createElement('td');
                valueCell.textContent = String(value);
            }

            row.innerHTML = `<td>${key}</td>`;
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    // Clear all storage
    clearAllStorageBtn.addEventListener('click', () => {
        localStorage.clear();
        updateTabContent('localstorage');
    });

    // Clear all cookies
    clearAllCookiesBtn.addEventListener('click', () => {
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.split('=');
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        updateTabContent('cookies');
    });

    // Internal Settings - Disable Analytics
    disableAnalyticsCheckbox.addEventListener('change', () => {
        localStorage.setItem('lta_do_not_track', disableAnalyticsCheckbox.checked ? 'true' : 'false');
    });
    disableAnalyticsCheckbox.checked = localStorage.getItem('lta_do_not_track') === 'true';

    grantPro.addEventListener('change', () => {
        localStorage.setItem('isPremium', disableAnalyticsCheckbox.checked ? 'false' : 'true');
    });
    grantPro.checked = localStorage.getItem('isPremium') === 'true';

    // Dev Tools Settings
    disableDevModeCheckbox.addEventListener('change', () => {
        if (disableDevModeCheckbox.checked) {
            devTools.style.display = 'none';
        }
    });

    opacitySlider.addEventListener('input', () => {
        const opacity = opacitySlider.value;
        devTools.style.setProperty('--background', `rgba(255, 255, 255, ${opacity})`);
        devTools.style.setProperty('--header-bg', `rgba(245, 245, 245, ${opacity})`);
        devTools.style.setProperty('--tabs-bg', `rgba(235, 235, 235, ${opacity})`);
        devTools.style.setProperty('--table-bg', `rgba(245, 245, 245, ${opacity})`);
        devTools.style.setProperty('--table-header-bg', `rgba(230, 230, 230, ${opacity})`);
        devTools.style.setProperty('--nested-table-bg', `rgba(220, 220, 220, ${opacity})`);
        if (window.matchMedia('(prefers-color-scheme: dark)').matches && !forceLightThemeBtn.classList.contains('active')) {
            devTools.style.setProperty('--background', `rgba(30, 30, 30, ${opacity})`);
            devTools.style.setProperty('--header-bg', `rgba(45, 45, 45, ${opacity})`);
            devTools.style.setProperty('--tabs-bg', `rgba(37, 37, 38, ${opacity})`);
            devTools.style.setProperty('--table-bg', `rgba(40, 40, 40, ${opacity})`);
            devTools.style.setProperty('--table-header-bg', `rgba(50, 50, 50, ${opacity})`);
            devTools.style.setProperty('--nested-table-bg', `rgba(45, 45, 46, ${opacity})`);
        }
    });

    forceLightThemeBtn.addEventListener('click', () => {
        forceLightThemeBtn.classList.add('active');
        forceDarkThemeBtn.classList.remove('active');
        const opacity = opacitySlider.value;
        devTools.style.setProperty('--background', `rgba(255, 255, 255, ${opacity})`);
        devTools.style.setProperty('--header-bg', `rgba(245, 245, 245, ${opacity})`);
        devTools.style.setProperty('--tabs-bg', `rgba(235, 235, 235, ${opacity})`);
        devTools.style.setProperty('--tab-button-bg', `rgba(200, 200, 200, 0.8)`);
        devTools.style.setProperty('--text-color', `#333333`);
        devTools.style.setProperty('--border-color', `rgba(150, 150, 150, 0.3)`);
        devTools.style.setProperty('--shadow-color', `rgba(0, 0, 0, 0.2)`);
        devTools.style.setProperty('--table-bg', `rgba(245, 245, 245, ${opacity})`);
        devTools.style.setProperty('--table-header-bg', `rgba(230, 230, 230, ${opacity})`);
        devTools.style.setProperty('--nested-table-bg', `rgba(220, 220, 220, ${opacity})`);
        devTools.style.setProperty('--resize-handle-bg', `rgba(150, 150, 150, 0.7)`);
    });

    forceDarkThemeBtn.addEventListener('click', () => {
        forceDarkThemeBtn.classList.add('active');
        forceLightThemeBtn.classList.remove('active');
        const opacity = opacitySlider.value;
        devTools.style.setProperty('--background', `rgba(30, 30, 30, ${opacity})`);
        devTools.style.setProperty('--header-bg', `rgba(45, 45, 45, ${opacity})`);
        devTools.style.setProperty('--tabs-bg', `rgba(37, 37, 38, ${opacity})`);
        devTools.style.setProperty('--tab-button-bg', `rgba(60, 60, 60, 0.8)`);
        devTools.style.setProperty('--text-color', `#ffffff`);
        devTools.style.setProperty('--border-color', `rgba(68, 68, 68, 0.3)`);
        devTools.style.setProperty('--shadow-color', `rgba(0, 0, 0, 0.4)`);
        devTools.style.setProperty('--table-bg', `rgba(40, 40, 40, ${opacity})`);
        devTools.style.setProperty('--table-header-bg', `rgba(50, 50, 50, ${opacity})`);
        devTools.style.setProperty('--nested-table-bg', `rgba(45, 45, 46, ${opacity})`);
        devTools.style.setProperty('--resize-handle-bg', `rgba(68, 68, 68, 0.7)`);
    });

    restartApp.addEventListener('click', () => {
        window.location.href = '/';
    });

    restartDebug.addEventListener('click', () => {
        window.location.href = window.location.href.split('?')[0] + '?dev=true';
    });

    // Update tab content
    function updateTabContent(tabId) {
        if (tabId === 'localstorage') {
            const tbody = document.getElementById('localStorageTable').querySelector('tbody');
            tbody.innerHTML = '';
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const row = document.createElement('tr');
                    const valueCell = document.createElement('td');
                    const actionCell = document.createElement('td');
                    let value = localStorage[key];

                    try {
                        const parsed = JSON.parse(value);
                        if (typeof parsed === 'object' && parsed !== null) {
                            valueCell.appendChild(createJsonTable(parsed));
                        } else {
                            valueCell.textContent = value;
                        }
                    } catch (e) {
                        valueCell.textContent = value;
                    }

                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-storage-btn';
                    clearBtn.textContent = 'Clear';
                    clearBtn.addEventListener('click', () => {
                        localStorage.removeItem(key);
                        updateTabContent('localstorage');
                    });

                    row.innerHTML = `<td>${key}</td>`;
                    row.appendChild(valueCell);
                    actionCell.appendChild(clearBtn);
                    row.appendChild(actionCell);
                    tbody.appendChild(row);
                }
            }
        } else if (tabId === 'system') {
            const tbody = document.getElementById('systemTable').querySelector('tbody');
            tbody.innerHTML = '';
            const systemInfo = {
                'User Agent': navigator.userAgent,
                'Language': navigator.language,
                'Screen Resolution': `${window.screen.width}x${window.screen.height}`,
                'Viewport Size': `${window.innerWidth}x${window.innerHeight}`,
                'Color Depth': `${screen.colorDepth} bits`,
                'Pixel Ratio': window.devicePixelRatio,
                'Available Screen': `${screen.availWidth}x${screen.availHeight}`,
                'Online Status': navigator.onLine ? 'Online' : 'Offline',
                'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
                'Platform': navigator.platform,
                'CPU Cores': navigator.hardwareConcurrency || 'Unknown',
                'Memory': navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
                'Touch Points': navigator.maxTouchPoints || 0,
                'Do Not Track': navigator.doNotTrack || 'Unknown',
                'Time Zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
                'Connection': navigator.connection?.effectiveType || 'Unknown',
                'Downlink': navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : 'Unknown'
            };
            for (let [key, value] of Object.entries(systemInfo)) {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${key}</td><td>${value}</td>`;
                tbody.appendChild(row);
            }
        } else if (tabId === 'cookies') {
            const tbody = document.getElementById('cookiesTable').querySelector('tbody');
            tbody.innerHTML = '';
            document.cookie.split(';').forEach(cookie => {
                if (cookie.trim()) {
                    const [name, value] = cookie.split('=').map(part => part.trim());
                    const row = document.createElement('tr');
                    const valueCell = document.createElement('td');
                    const actionCell = document.createElement('td');

                    try {
                        const parsed = JSON.parse(decodeURIComponent(value));
                        if (typeof parsed === 'object' && parsed !== null) {
                            valueCell.appendChild(createJsonTable(parsed));
                        } else {
                            valueCell.textContent = decodeURIComponent(value);
                        }
                    } catch (e) {
                        valueCell.textContent = decodeURIComponent(value);
                    }

                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-storage-btn';
                    clearBtn.textContent = 'Clear';
                    clearBtn.addEventListener('click', () => {
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                        updateTabContent('cookies');
                    });

                    row.innerHTML = `<td>${name}</td>`;
                    row.appendChild(valueCell);
                    actionCell.appendChild(clearBtn);
                    row.appendChild(actionCell);
                    tbody.appendChild(row);
                }
            });
        }
    }
    updateTabContent('localstorage');
});