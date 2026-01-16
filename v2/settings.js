(function injectSettingsOverlay() {
	if (document.getElementById('settings-overlay')) {
		return;
	}

	const template = `
		<div id="settings-overlay" class="settings-overlay">
			<div class="settings-header flex justify-between items-center mb-4">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-semibold">Settings</h2>
				</div>
				<button onclick="toggleSettingsOverlay(false)" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="settings-content-wrapper">
				<div class="settings-sidebar">
					<button class="settings-category-btn active" data-category="editing" onclick="switchSettingsCategory('editing')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						<span>Editing & Interface</span>
					</button>
					<button class="settings-category-btn" data-category="counter" onclick="switchSettingsCategory('counter')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						<span>Counter Display</span>
					</button>
					<button class="settings-category-btn" data-category="storage" onclick="switchSettingsCategory('storage')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
						</svg>
						<span>Storage</span>
					</button>
					<button class="settings-category-btn" data-category="general" onclick="switchSettingsCategory('general')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span>General</span>
					</button>
					<button class="settings-category-btn" data-category="about" onclick="switchSettingsCategory('about')">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>About</span>
					</button>
				</div>

				<div class="settings-main-content">
					<div class="settings-category-content active" data-category="editing">
						<h3 class="text-lg font-medium mb-4">Editing & Interface</h3>
						<div class="space-y-3">
							<div class="flex items-center justify-between p-3 rounded-md" style="background: #f3f4f6;">
								<div>
									<span class="font-medium">AutoSave</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically save your work with every change</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" id="autoSave" class="sr-only peer" checked onchange="toggleSetting('autoSave', this.checked)">
									<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between p-3 rounded-md" style="background: #f3f4f6;">
								<div>
									<span class="font-medium">Warn on leave</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Show warning when leaving the page if AutoSave is disabled</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" id="warnLeave" class="sr-only peer" checked onchange="toggleSetting('warnLeave', this.checked)">
									<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between p-3 rounded-md" style="background: #f3f4f6;">
								<div>
									<span class="font-medium">Spell check</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Enable native browser spell checking</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" id="spellCheck" class="sr-only peer" checked onchange="toggleSetting('spellCheck', this.checked)">
									<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
								</label>
							</div>

							<div class="flex items-center justify-between p-3 rounded-md" style="background: #f3f4f6;">
								<div>
									<span class="font-medium">Focus</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Hide all content beyond the main app for distraction-free writing (Recommended)</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" id="focus" class="sr-only peer" onchange="toggleSetting('focus', this.checked)">
									<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
								</label>
							</div>

							<div class="p-3 rounded-md" style="background: #f3f4f6;">
								<div class="flex items-center justify-between mb-3">
									<div>
										<span class="font-medium">Font Size</span>
										<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust the text size in the editor</p>
									</div>
									<span id="fontSizeDisplay" class="text-sm text-gray-600 dark:text-gray-300 font-mono" style="font-size:18px;">16px</span>
								</div>
								<input type="range" id="fontSizeSlider" min="12" max="24" value="16" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" oninput="updateFontSize(this.value); document.getElementById('fontSizeDisplay').textContent = this.value + 'px'">
							</div>

							<div class="p-3 rounded-md" style="background: #f3f4f6;">
								<div class="mb-3">
									<span class="font-medium">Default Citation Style</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Default citation style for the citation generator</p>
								</div>
								<div class="relative">
									<select id="defaultCitationStyleSelect" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" onchange="updateDefaultCitationStyle(this.value)">
										<option value="mla">MLA 9th Edition</option>
										<option value="apa">APA 7th Edition</option>
										<option value="harvard">Harvard</option>
									</select>
								</div>
							</div>

							<div class="p-3 rounded-md" style="background: #f3f4f6;">
								<div class="mb-3">
									<span class="font-medium">Font Family</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose the typeface for the editor</p>
								</div>
								<div class="relative">
									<button type="button" id="fontFamilyButton" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-left flex items-center justify-between" onclick="toggleFontFamilyDropdown()">
										<span id="fontFamilyButtonText" style="font-family: system-ui;">System UI</span>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
										</svg>
									</button>
									<div id="fontFamilyDropdown" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
										<div class="max-h-48 overflow-y-auto">
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="system-ui" style="font-family: system-ui;" onclick="selectFontFamily('system-ui', 'System UI')">System UI</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="serif" style="font-family: serif;" onclick="selectFontFamily('serif', 'Serif')">Serif</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="monospace" style="font-family: monospace;" onclick="selectFontFamily('monospace', 'Monospace')">Monospace</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Times New Roman', serif" style="font-family: 'Times New Roman', serif;" onclick="selectFontFamily('\\'Times New Roman\\', serif', 'Times New Roman')">Times New Roman</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Arial', sans-serif" style="font-family: 'Arial', sans-serif;" onclick="selectFontFamily('\\'Arial\\', sans-serif', 'Arial')">Arial</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Helvetica', sans-serif" style="font-family: 'Helvetica', sans-serif;" onclick="selectFontFamily('\\'Helvetica\\', sans-serif', 'Helvetica')">Helvetica</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Georgia', serif" style="font-family: 'Georgia', serif;" onclick="selectFontFamily('\\'Georgia\\', serif', 'Georgia')">Georgia</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Courier New', monospace" style="font-family: 'Courier New', monospace;" onclick="selectFontFamily('\\'Courier New\\', monospace', 'Courier New')">Courier New</div>
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="'Verdana', sans-serif" style="font-family: 'Verdana', sans-serif;" onclick="selectFontFamily('\\'Verdana\\', sans-serif', 'Verdana')">Verdana</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="settings-category-content" data-category="counter">
						<h3 class="text-lg font-medium mb-4">Counter Display</h3>
						<div class="space-y-3">
							<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize which counters appear in the top bar and their order. Use the arrow buttons to reorder.</p>
							<button onclick="resetCountersToDefault()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors mb-4" data-lta-event="v2-reset-counters-default">
								Reset to Default
							</button>
							<div id="counter-settings-container" class="space-y-3"></div>
						</div>
					</div>

					<div class="settings-category-content" data-category="storage">
						<h3 class="text-lg font-medium mb-4">Manage Storage</h3>
						<div class="space-y-4">
							<div class="p-4 rounded-md" style="background: #f3f4f6;">
								<div class="flex items-center justify-between mb-2">
									<span class="font-medium">Storage Usage</span>
									<span id="storage-usage-text" class="text-sm font-mono text-gray-600 dark:text-gray-300">0 KB / 4.28 MB</span>
								</div>
								<div class="storage-bar-container">
									<div id="storage-bar-fill" class="storage-bar-fill" style="width: 0%;"></div>
								</div>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Projects and settings are stored locally in your browser. System files cannot be deleted. This is a hard storage limit imposed by browsers.</p>
							</div>

							<div class="p-4 rounded-md" style="background: #f3f4f6;">
								<div class="flex items-center justify-between mb-3">
									<span class="font-medium">Items</span>
									<span id="project-count-text" class="text-sm text-gray-600 dark:text-gray-300">0 items</span>
								</div>
								<div id="storage-project-list" class="storage-project-list"></div>
							</div>
						</div>
					</div>

					<div class="settings-category-content" data-category="general">
						<h3 class="text-lg font-medium mb-4">General</h3>
						<div class="space-y-3 mb-4">
							<div class="p-3 rounded-md" style="background: #f3f4f6;">
								<h4 class="font-medium mb-3">Backup & Restore Settings</h4>
								<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Export your settings to a file or import settings from a backup.</p>
								<div class="flex gap-4 flex-wrap">
									<button onclick="exportSettings()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors flex items-center gap-2" data-lta-event="v2-export-settings-click">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
											<polyline points="7 10 12 15 17 10"/>
											<line x1="12" y1="15" x2="12" y2="3"/>
										</svg>
										Export Settings
									</button>
									<label class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-2" data-lta-event="v2-import-settings-click">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
											<polyline points="17 8 12 3 7 8"/>
											<line x1="12" y1="3" x2="12" y2="15"/>
										</svg>
										Import Settings
										<input type="file" id="import-settings-input" accept=".json" onchange="importSettings(event)" class="hidden">
									</label>
								</div>
							</div>
						</div>

						<div class="space-y-3 mb-4">
							<div class="p-3 rounded-md" style="background: #f3f4f6;">
								<h4 class="font-medium mb-3">Backup & Restore Projects</h4>
								<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Export all your projects to a file or import projects from a backup. This includes all project content, citations, and metadata.</p>
								<div class="flex gap-4 flex-wrap">
									<button onclick="exportProjects()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors flex items-center gap-2" data-lta-event="v2-export-projects-click">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
											<polyline points="7 10 12 15 17 10"/>
											<line x1="12" y1="15" x2="12" y2="3"/>
										</svg>
										Export All Projects
									</button>
									<label class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors cursor-pointer flex items-center gap-2" data-lta-event="v2-import-projects-click">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
											<polyline points="17 8 12 3 7 8"/>
											<line x1="12" y1="3" x2="12" y2="15"/>
										</svg>
										Import Projects
										<input type="file" id="import-projects-input" accept=".json" onchange="importProjects(event)" class="hidden">
									</label>
								</div>
							</div>
						</div>

						<div class="text-center p-3 rounded-md" style="background: #f3f4f6;">
							<button id="resetSettings" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors" onclick="showNotification('Are you sure you want to reset all settings? This will permanently delete all saved projects, citation history, and customized settings. This action cannot be undone. Please save your text before proceeding.', true, () => { resetSettings(); }, 'confirmation')">Reset All Settings</button>
							<p class="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-md mx-auto">This will clear all localStorage data including saved projects, citation history, and customized settings. Requires app restart to take effect. Recommended if CiteCount is not working as expected.</p>
						</div>
					</div>

					<div class="settings-category-content" data-category="about">
						<h3 class="text-lg font-medium mb-4">About CiteCount</h3>
						<div class="space-y-4">
							<div class="grid grid-cols-2 gap-4">
								<div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
									<div class="text-sm text-gray-500 dark:text-gray-400">Version</div>
									<div class="font-medium">4.0 (4A09b)</div>
								</div>
								<div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
									<div class="text-sm text-gray-500 dark:text-gray-400">Status</div>
									<div class="font-medium text-green-600 dark:text-green-400">Active</div>
								</div>
							</div>

							<div>
								<h4 class="font-medium mb-2">What's new</h4>
								<ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
									<li>Brand new document & folder management system</li>
									<li>Advanced citation generator with history tracking</li>
									<li>Storage management with quota monitoring</li>
									<li>Projects export/import functionality</li>
									<li>Settings backup and restore</li>
									<li>Intelligent file import queuing system</li>
									<li>Storage quota exceeded notifications</li>
									<li>Multi-file batch processing</li>
									<li>Enhanced project organization</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

	const placeholder = document.getElementById('settings-overlay-placeholder');
	if (placeholder) {
		placeholder.outerHTML = template;
		return;
	}

	const helpOverlay = document.getElementById('help-overlay');
	if (helpOverlay && helpOverlay.parentNode) {
		helpOverlay.insertAdjacentHTML('beforebegin', template);
	} else {
		document.body.insertAdjacentHTML('beforeend', template);
	}
})();
