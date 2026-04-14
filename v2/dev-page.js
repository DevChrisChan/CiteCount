(function initDevPage() {
	const tabs = [
		'localstorage',
		'system',
		'internalSettings',
		'devToolsSettings',
		'console',
		'errors',
		'cookies'
	];

	let clearAllStorageConfirm = false;
	const clearItemConfirm = {};
	let clearAllCookiesConfirm = false;
	const clearCookieConfirm = {};
	const devConsoleLogs = [];
	const devErrors = [];

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function devNotify(message) {
		const toast = document.getElementById('dev-toast');
		if (!toast) {
			return;
		}
		toast.textContent = message;
		toast.classList.add('show');
		clearTimeout(devNotify._timer);
		devNotify._timer = setTimeout(() => {
			toast.classList.remove('show');
		}, 2500);
	}

	function formatValue(value) {
		if (typeof value === 'string') {
			return value;
		}
		try {
			return JSON.stringify(value, null, 2);
		} catch (error) {
			return String(value);
		}
	}

	function createCell(tag, html) {
		const cell = document.createElement(tag);
		cell.innerHTML = html;
		return cell;
	}

	function createTable(headers) {
		const table = document.createElement('table');
		table.className = 'dev-table';
		const thead = document.createElement('thead');
		const headRow = document.createElement('tr');
		headers.forEach((header) => {
			headRow.appendChild(createCell('th', escapeHtml(header)));
		});
		thead.appendChild(headRow);
		table.appendChild(thead);
		const tbody = document.createElement('tbody');
		table.appendChild(tbody);
		return { table, tbody };
	}

	function buildActionButton(label, className, onClick) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = className;
		button.textContent = label;
		button.addEventListener('click', onClick);
		return button;
	}

	function setActiveTab(tabId) {
		document.querySelectorAll('.dev-tab-btn').forEach((btn) => {
			const isActive = btn.dataset.devTab === tabId;
			btn.classList.toggle('active', isActive);
		});
	}

	function renderLocalStorage(contentDiv) {
		contentDiv.innerHTML = '';
		const actions = document.createElement('div');
		actions.className = 'actions-row';
		let searchQuery = '';
		const searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.placeholder = 'Search keys or values';
		searchInput.className = 'dev-search-input';
		const toolbar = document.createElement('div');
		toolbar.className = 'actions-row';
		toolbar.style.display = 'flex';
		toolbar.style.gap = '0.5rem';
		toolbar.style.flexWrap = 'wrap';
		toolbar.appendChild(searchInput);
		const clearAllBtn = buildActionButton('Clear All', 'btn danger', () => {
			if (!clearAllStorageConfirm) {
				clearAllStorageConfirm = true;
				clearAllBtn.textContent = 'Click again to confirm';
				clearAllBtn.classList.add('danger-confirm');
				setTimeout(() => {
					if (clearAllStorageConfirm) {
						clearAllStorageConfirm = false;
						clearAllBtn.textContent = 'Clear All';
						clearAllBtn.classList.remove('danger-confirm');
					}
				}, 3000);
				return;
			}
			localStorage.clear();
			clearAllStorageConfirm = false;
			devNotify('All localStorage data cleared.');
			renderTable();
		});
		actions.appendChild(clearAllBtn);
		contentDiv.appendChild(toolbar);
		contentDiv.appendChild(actions);

		function renderTable() {
			const existingTable = contentDiv.querySelector('.dev-table');
			if (existingTable) {
				existingTable.remove();
			}

			const { table, tbody } = createTable(['Key', 'Value', 'Action']);
			const keys = Object.keys(localStorage);
			const query = searchQuery.trim().toLowerCase();
			let renderedCount = 0;

			keys.forEach((key) => {
				const rawValue = localStorage.getItem(key);
				const haystack = `${key} ${String(rawValue)}`.toLowerCase();
				if (query && !haystack.includes(query)) {
					return;
				}

				renderedCount += 1;
				const row = document.createElement('tr');
				const keyCell = document.createElement('td');
				const keyInput = document.createElement('input');
				keyInput.type = 'text';
				keyInput.className = 'dev-edit-input';
				keyInput.value = key;
				keyCell.appendChild(keyInput);
				const valueCell = document.createElement('td');
				const valueInput = document.createElement('textarea');
				valueInput.className = 'dev-edit-value';
				valueInput.value = formatValue(rawValue);
				valueCell.appendChild(valueInput);
				const actionCell = document.createElement('td');
				const saveBtn = buildActionButton('Save', 'btn primary small', () => {
					const nextKey = keyInput.value.trim();
					const nextValue = valueInput.value;

					if (!nextKey) {
						devNotify('Key cannot be empty.');
						return;
					}

					if (nextKey !== key && localStorage.getItem(nextKey) !== null) {
						devNotify(`Key already exists: ${nextKey}`);
						return;
					}

					if (nextKey !== key) {
						localStorage.removeItem(key);
					}
					localStorage.setItem(nextKey, nextValue);
					devNotify(`Saved localStorage key: ${nextKey}`);
					renderTable();
				});

				const clearBtn = buildActionButton('Delete', 'btn danger small', () => {
					if (!clearItemConfirm[key]) {
						clearItemConfirm[key] = true;
						clearBtn.textContent = 'Confirm?';
						clearBtn.classList.add('danger-confirm');
						setTimeout(() => {
							if (clearItemConfirm[key]) {
								clearItemConfirm[key] = false;
								clearBtn.textContent = 'Clear';
								clearBtn.classList.remove('danger-confirm');
							}
						}, 3000);
						return;
					}
					localStorage.removeItem(key);
					clearItemConfirm[key] = false;
					devNotify(`Removed localStorage key: ${key}`);
					renderTable();
				});
					actionCell.appendChild(saveBtn);
					actionCell.appendChild(document.createTextNode(' '));
				actionCell.appendChild(clearBtn);
				row.appendChild(keyCell);
				row.appendChild(valueCell);
				row.appendChild(actionCell);
				tbody.appendChild(row);
			});

			if (!renderedCount) {
				const row = document.createElement('tr');
				const emptyCell = createCell('td', keys.length ? 'No matching localStorage entries.' : 'No localStorage entries found.');
				emptyCell.colSpan = 3;
				emptyCell.className = 'empty-cell';
				row.appendChild(emptyCell);
				tbody.appendChild(row);
			}

			contentDiv.appendChild(table);
		}

		searchInput.addEventListener('input', () => {
			searchQuery = searchInput.value;
			renderTable();
		});
		renderTable();
	}

	function renderSystem(contentDiv) {
		contentDiv.innerHTML = '';
		const { table, tbody } = createTable(['Property', 'Value']);
		const systemInfo = {
			'User Agent': navigator.userAgent,
			Language: navigator.language,
			'Screen Resolution': `${window.screen.width}x${window.screen.height}`,
			'Viewport Size': `${window.innerWidth}x${window.innerHeight}`,
			'Color Depth': `${screen.colorDepth} bits`,
			'Pixel Ratio': window.devicePixelRatio,
			'Available Screen': `${screen.availWidth}x${screen.availHeight}`,
			'Online Status': navigator.onLine ? 'Online' : 'Offline',
			'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
			Platform: navigator.platform,
			'CPU Cores': navigator.hardwareConcurrency || 'Unknown',
			Memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown',
			'Touch Points': navigator.maxTouchPoints || 0,
			'Do Not Track': navigator.doNotTrack || 'Unknown',
			'Time Zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
			Connection: navigator.connection?.effectiveType || 'Unknown',
			Downlink: navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : 'Unknown',
			'Current Location': window.location.href
		};

		Object.entries(systemInfo).forEach(([key, value]) => {
			const row = document.createElement('tr');
			row.appendChild(createCell('td', `<strong>${escapeHtml(key)}</strong>`));
			row.appendChild(createCell('td', escapeHtml(String(value))));
			tbody.appendChild(row);
		});

		contentDiv.appendChild(table);
	}

	function renderInternalSettings(contentDiv) {
		contentDiv.innerHTML = '';
		const { table, tbody } = createTable(['Setting', 'Value']);

		const disableAnalytics = localStorage.getItem('lta_do_not_track') === 'true';
		const isPremium = localStorage.getItem('isPremium') === 'true';

		const analyticsRow = document.createElement('tr');
		analyticsRow.appendChild(createCell('td', 'Disable Analytics'));
		const analyticsValue = document.createElement('td');
		const analyticsCheckbox = document.createElement('input');
		analyticsCheckbox.type = 'checkbox';
		analyticsCheckbox.checked = disableAnalytics;
		analyticsCheckbox.addEventListener('change', () => {
			localStorage.setItem('lta_do_not_track', analyticsCheckbox.checked ? 'true' : 'false');
			devNotify('Analytics preference updated.');
		});
		analyticsValue.appendChild(analyticsCheckbox);
		analyticsRow.appendChild(analyticsValue);
		tbody.appendChild(analyticsRow);

		const premiumRow = document.createElement('tr');
		premiumRow.appendChild(createCell('td', 'Grant Pro'));
		const premiumValue = document.createElement('td');
		const premiumCheckbox = document.createElement('input');
		premiumCheckbox.type = 'checkbox';
		premiumCheckbox.checked = isPremium;
		premiumCheckbox.addEventListener('change', () => {
			localStorage.setItem('isPremium', premiumCheckbox.checked ? 'true' : 'false');
			devNotify('Pro access flag updated.');
		});
		premiumValue.appendChild(premiumCheckbox);
		premiumRow.appendChild(premiumValue);
		tbody.appendChild(premiumRow);

		const restartProdRow = document.createElement('tr');
		restartProdRow.appendChild(createCell('td', 'Restart app as prod'));
		const restartProdValue = document.createElement('td');
		restartProdValue.appendChild(buildActionButton('Restart', 'btn primary', () => {
			window.location.href = '/';
		}));
		restartProdRow.appendChild(restartProdValue);
		tbody.appendChild(restartProdRow);

		const restartDevRow = document.createElement('tr');
		restartDevRow.appendChild(createCell('td', 'Restart app in debug mode'));
		const restartDevValue = document.createElement('td');
		restartDevValue.appendChild(buildActionButton('Restart', 'btn primary', () => {
			window.location.href = `${window.location.href.split('?')[0]}?dev=true`;
		}));
		restartDevRow.appendChild(restartDevValue);
		tbody.appendChild(restartDevRow);

		contentDiv.appendChild(table);
	}

	function renderDevToolsSettings(contentDiv) {
		contentDiv.innerHTML = '';
		const { table, tbody } = createTable(['Setting', 'Value']);

		const row = document.createElement('tr');
		row.appendChild(createCell('td', 'Open Floating Dev Tools'));
		const actionCell = document.createElement('td');
		actionCell.appendChild(buildActionButton('Open', 'btn primary', () => {
			const devToolsWindow = document.getElementById('devToolsWindow');
			if (devToolsWindow) {
				devToolsWindow.style.display = 'flex';
				devNotify('Floating Dev Tools opened.');
				return;
			}
			devNotify('Floating Dev Tools is not available on this page.');
		}));
		row.appendChild(actionCell);
		tbody.appendChild(row);

		contentDiv.appendChild(table);
	}

	function renderConsole(contentDiv) {
		contentDiv.innerHTML = '';
		const pre = document.createElement('pre');
		pre.id = 'dev-console-output';
		pre.className = 'dev-console-output';
		pre.textContent = devConsoleLogs.length ? devConsoleLogs.join('\n') : 'Console output will appear here...';
		contentDiv.appendChild(pre);
	}

	function renderErrors(contentDiv) {
		contentDiv.innerHTML = '';
		const { table, tbody } = createTable(['Time', 'Error']);
		if (!devErrors.length) {
			const row = document.createElement('tr');
			const emptyCell = createCell('td', 'No errors recorded');
			emptyCell.colSpan = 2;
			emptyCell.className = 'empty-cell';
			row.appendChild(emptyCell);
			tbody.appendChild(row);
		} else {
			devErrors.forEach((entry) => {
				const row = document.createElement('tr');
				row.appendChild(createCell('td', escapeHtml(entry.time)));
				row.appendChild(createCell('td', escapeHtml(entry.message)));
				tbody.appendChild(row);
			});
		}
		contentDiv.appendChild(table);
	}

	function renderCookies(contentDiv) {
		contentDiv.innerHTML = '';
		const actions = document.createElement('div');
		actions.className = 'actions-row';
		const clearAllBtn = buildActionButton('Clear All', 'btn danger', () => {
			if (!clearAllCookiesConfirm) {
				clearAllCookiesConfirm = true;
				clearAllBtn.textContent = 'Click again to confirm';
				clearAllBtn.classList.add('danger-confirm');
				setTimeout(() => {
					if (clearAllCookiesConfirm) {
						clearAllCookiesConfirm = false;
						clearAllBtn.textContent = 'Clear All';
						clearAllBtn.classList.remove('danger-confirm');
					}
				}, 3000);
				return;
			}
			document.cookie.split(';').forEach((cookie) => {
				const [nameRaw] = cookie.split('=');
				const name = nameRaw && nameRaw.trim();
				if (name) {
					document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
				}
			});
			clearAllCookiesConfirm = false;
			devNotify('All accessible cookies cleared.');
			renderCookies(contentDiv);
		});
		actions.appendChild(clearAllBtn);
		contentDiv.appendChild(actions);

		const { table, tbody } = createTable(['Name', 'Value', 'Action']);
		const cookies = document.cookie
			.split(';')
			.map((cookie) => cookie.trim())
			.filter(Boolean);

		if (!cookies.length) {
			const row = document.createElement('tr');
			const emptyCell = createCell('td', 'No cookies found');
			emptyCell.colSpan = 3;
			emptyCell.className = 'empty-cell';
			row.appendChild(emptyCell);
			tbody.appendChild(row);
		} else {
			cookies.forEach((cookiePair) => {
				const separatorIndex = cookiePair.indexOf('=');
				const name = separatorIndex > -1 ? cookiePair.slice(0, separatorIndex).trim() : cookiePair;
				const rawValue = separatorIndex > -1 ? cookiePair.slice(separatorIndex + 1) : '';
				let decodedValue = rawValue;
				try {
					decodedValue = decodeURIComponent(rawValue);
				} catch (error) {
					decodedValue = rawValue;
				}

				const row = document.createElement('tr');
				row.appendChild(createCell('td', escapeHtml(name)));
				row.appendChild(createCell('td', `<pre>${escapeHtml(decodedValue)}</pre>`));
				const actionCell = document.createElement('td');
				const clearBtn = buildActionButton('Clear', 'btn danger small', () => {
					if (!clearCookieConfirm[name]) {
						clearCookieConfirm[name] = true;
						clearBtn.textContent = 'Confirm?';
						clearBtn.classList.add('danger-confirm');
						setTimeout(() => {
							if (clearCookieConfirm[name]) {
								clearCookieConfirm[name] = false;
								clearBtn.textContent = 'Clear';
								clearBtn.classList.remove('danger-confirm');
							}
						}, 3000);
						return;
					}
					document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
					clearCookieConfirm[name] = false;
					devNotify(`Cleared cookie: ${name}`);
					renderCookies(contentDiv);
				});
				actionCell.appendChild(clearBtn);
				row.appendChild(actionCell);
				tbody.appendChild(row);
			});
		}

		contentDiv.appendChild(table);
	}

	function switchDevTab(tabId) {
		if (!tabs.includes(tabId)) {
			return;
		}
		setActiveTab(tabId);
		const contentDiv = document.getElementById('dev-content');
		if (!contentDiv) {
			return;
		}

		if (tabId === 'localstorage') {
			renderLocalStorage(contentDiv);
			return;
		}
		if (tabId === 'system') {
			renderSystem(contentDiv);
			return;
		}
		if (tabId === 'internalSettings') {
			renderInternalSettings(contentDiv);
			return;
		}
		if (tabId === 'devToolsSettings') {
			renderDevToolsSettings(contentDiv);
			return;
		}
		if (tabId === 'console') {
			renderConsole(contentDiv);
			return;
		}
		if (tabId === 'errors') {
			renderErrors(contentDiv);
			return;
		}
		renderCookies(contentDiv);
	}

	function setupConsoleAndErrorCapture() {
		if (window.__devPageConsoleHooked) {
			return;
		}
		window.__devPageConsoleHooked = true;

		const originalLog = console.log;
		const originalError = console.error;

		function appendConsoleLine(prefix, args) {
			const output = args
				.map((arg) => {
					if (typeof arg === 'string') {
						return arg;
					}
					try {
						return JSON.stringify(arg);
					} catch (error) {
						return String(arg);
					}
				})
				.join(' ');
			devConsoleLogs.push(`${prefix}${output}`);
			if (devConsoleLogs.length > 400) {
				devConsoleLogs.shift();
			}
			const pre = document.getElementById('dev-console-output');
			if (pre) {
				pre.textContent = devConsoleLogs.join('\n');
				pre.scrollTop = pre.scrollHeight;
			}
		}

		console.log = function (...args) {
			appendConsoleLine('', args);
			originalLog.apply(console, args);
		};

		console.error = function (...args) {
			appendConsoleLine('[ERROR] ', args);
			originalError.apply(console, args);
		};

		window.addEventListener('error', (event) => {
			devErrors.push({
				time: new Date().toLocaleTimeString(),
				message: `${event.message} (${event.filename}:${event.lineno}:${event.colno})`
			});
			if (devErrors.length > 400) {
				devErrors.shift();
			}
			const activeTab = document.querySelector('.dev-tab-btn.active')?.dataset.devTab;
			if (activeTab === 'errors') {
				switchDevTab('errors');
			}
		});

		window.addEventListener('unhandledrejection', (event) => {
			const message = event.reason && event.reason.message ? event.reason.message : String(event.reason);
			devErrors.push({
				time: new Date().toLocaleTimeString(),
				message: `Unhandled Promise Rejection: ${message}`
			});
			if (devErrors.length > 400) {
				devErrors.shift();
			}
			const activeTab = document.querySelector('.dev-tab-btn.active')?.dataset.devTab;
			if (activeTab === 'errors') {
				switchDevTab('errors');
			}
		});
	}

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.dev-tab-btn').forEach((btn) => {
			btn.addEventListener('click', () => {
				switchDevTab(btn.dataset.devTab);
			});
		});

		const openMainAppBtn = document.getElementById('open-main-app');
		if (openMainAppBtn) {
			openMainAppBtn.addEventListener('click', () => {
				window.location.href = '/';
			});
		}

		setupConsoleAndErrorCapture();
		switchDevTab('localstorage');
	});

	window.switchDevTab = switchDevTab;
})();
