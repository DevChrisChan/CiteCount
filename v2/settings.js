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
					<button class="settings-category-btn" data-category="tools" onclick="switchSettingsCategory('tools'); setTimeout(() => initializeToolsSelection(), 50);">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
						</svg>
						<span>Customise Tools</span>
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
					
					<!-- Faint divider before Developers -->
					<div id="developers-divider" style="border-top: 1px solid rgba(156, 163, 175, 0.2); margin: 0.5rem 0; display: none;"></div>
					
					<button class="settings-category-btn" data-category="developers" onclick="switchSettingsCategory('developers')" id="developers-category-btn" style="display: none;">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
						</svg>
						<span>Developers</span>
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

							<div class="flex items-center justify-between p-3 rounded-md" style="background: #f3f4f6;">
								<div>
									<span class="font-medium">Simplified Mode</span>
									<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Hide sidebar and tools, keep only citations for a cleaner, distraction-free interface</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" id="simplifiedMode" class="sr-only peer" onchange="toggleSetting('simplifiedMode', this.checked)">
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
										<span id="fontFamilyButtonText" style="font-family: system-ui;">System Font</span>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
										</svg>
									</button>
									<div id="fontFamilyDropdown" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
										<div class="max-h-48 overflow-y-auto">
											<div class="font-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-value="system-ui" style="font-family: system-ui;" onclick="selectFontFamily('system-ui', 'System Font')">System Font</div>
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

						<div class="flex items-center justify-between p-3 rounded-md" id="developer-mode-toggle" style="background: #f3f4f6; display: none;">
							<div>
								<span class="font-medium">Developer Mode</span>
								<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Enable advanced debugging and development tools</p>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" id="developerMode" class="sr-only peer" onchange="toggleDeveloperMode(this.checked)">
								<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
							</label>
						</div>
					</div>
				</div>

				<div class="settings-category-content" data-category="counter">
					<h3 class="text-lg font-medium mb-4">Counter Display</h3>
					<div class="space-y-3">
						<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize which counters appear in the top bar and their order. Use the arrow buttons to reorder.</p>
							<button onclick="resetCountersToDefault()" class="px-4 py-2 hover:bg-blue-600 text-white rounded-md font-medium transition-colors mb-4" data-lta-event="v2-reset-counters-default" style="background-color: #1F40AF;">
								Reset to Default
							</button>
							<div id="counter-settings-container" class="space-y-3"></div>
						</div>
					</div>

					<div class="settings-category-content" data-category="tools">
						<h3 class="text-lg font-medium mb-4">Customise Tools</h3>
						<div class="space-y-4">
							<p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Select 2 tools to pin as quick-access tabs. All other tools are available in More Tools.</p>
							
							<div id="tools-pinning-container" class="space-y-4">
								<!-- Tools pinning UI will be populated here by JavaScript -->
							</div>
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

							<div>							<h4 class="font-medium mb-2">Interactive Tour</h4>
							<p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Take a guided tour to learn about CiteCount's features.</p>
							<button onclick="if(typeof startCiteCountGuide === 'function') { toggleSettingsOverlay(false); startCiteCountGuide(); }" class="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm" data-lta-event="v2-settings-tour-click">
								Start Interactive Tour
							</button>
						</div>

						<div>								<h4 class="font-medium mb-2">What's new</h4>
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

					<div class="settings-category-content" data-category="developers">
						<h3 class="text-lg font-medium mb-4">Developers</h3>
						<div class="space-y-3">
							<!-- Dev Tools Tabs -->
							<div style="border: 1px solid var(--border-primary); border-radius: 0.5rem; overflow: hidden;">
								<div style="display: flex; gap: 0.25rem; background: var(--background-secondary); padding: 0.5rem; border-bottom: 1px solid var(--border-primary); overflow-x: auto;">
									<button class="dev-tab-btn active" data-dev-tab="localstorage" onclick="switchDevTab('localstorage')" style="padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Local Storage</button>
									<button class="dev-tab-btn" data-dev-tab="system" onclick="switchDevTab('system')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">System Info</button>
									<button class="dev-tab-btn" data-dev-tab="internalSettings" onclick="switchDevTab('internalSettings')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Internal Settings</button>
									<button class="dev-tab-btn" data-dev-tab="devToolsSettings" onclick="switchDevTab('devToolsSettings')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Dev Tools Settings</button>
									<button class="dev-tab-btn" data-dev-tab="console" onclick="switchDevTab('console')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Console</button>
									<button class="dev-tab-btn" data-dev-tab="errors" onclick="switchDevTab('errors')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Errors</button>
									<button class="dev-tab-btn" data-dev-tab="cookies" onclick="switchDevTab('cookies')" style="padding: 0.5rem 1rem; background: transparent; color: var(--text-primary); border: none; border-radius: 0.375rem; cursor: pointer; white-space: nowrap; font-size: 0.875rem;">Cookies</button>
								</div>
								<div id="dev-content" style="padding: 1rem; max-height: 400px; overflow-y: auto;" class="text-sm">
									<!-- Content populated by switchDevTab -->
								</div>
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

	// Initialize tools selection UI after DOM update
	setTimeout(() => {
		initializeToolsSelection();
	}, 150);
})();

// Tool configuration
const AVAILABLE_TOOLS = [
	{ id: 'citations', name: 'Citations', icon: '📚', description: 'View and manage citations' },
	{ id: 'generateCitation', name: 'Generate Citation', icon: '📝', description: 'Create formatted citations' },
	{ id: 'details', name: 'Word Count Details', icon: '📊', description: 'Detailed word count statistics' },
	{ id: 'dictionary', name: 'Dictionary', icon: '📖', description: 'Look up word definitions' },
	{ id: 'thesaurus', name: 'Thesaurus', icon: '🧠', description: 'Find synonyms and related words' },
	{ id: 'pomodoro', name: 'Pomodoro Timer', icon: '🍅', description: 'Time-boxed work sessions' },
	{ id: 'translate', name: 'Translate', icon: '🌐', description: 'Translate text between languages' },
	{ id: 'notepad', name: 'Notepad', icon: '📓', description: 'Simple note-taking tool' },
	{ id: 'wordbank', name: 'Word Bank', icon: '📚', description: 'Curated vocabulary collection' },
	{ id: 'scientificCalculator', name: 'Scientific Calculator', icon: '🧮', description: 'Quick scientific calculations' },
	{ id: 'graphingCalculator', name: 'Graphing Calculator', icon: '📈', description: 'Plot and analyze graphs' }
];

const DEFAULT_PINNED_TOOLS = ['generateCitation', 'details'];

// Store previous settings state (used for validation and restore on force reload)
let previousPinnedTools = null;

// Get pinned tools from localStorage (Tab 2 and Tab 3, Tab 1 is always Citations)
function getPinnedTools() {
	const stored = localStorage.getItem('pinnedTools');
	return stored ? JSON.parse(stored) : DEFAULT_PINNED_TOOLS;
}

// Save pinned tools to localStorage
function savePinnedTools(toolIds) {
	localStorage.setItem('pinnedTools', JSON.stringify(toolIds));
	// Trigger UI update if available
	if (typeof updateToolsDisplay === 'function') {
		updateToolsDisplay();
	}
}

// Store the current settings when opening the modal (for restore on cancel/force reload)
function storeCurrentSettings() {
	previousPinnedTools = [...getPinnedTools()];
}

// Restore previous settings (called on force reload or when closing without valid selection)
function restorePreviousSettings() {
	if (previousPinnedTools !== null) {
		savePinnedTools(previousPinnedTools);
		previousPinnedTools = null;
	}
}

// Validate that at least 2 tools are selected
function validateToolsSelection() {
	const pinnedTools = getPinnedTools();
	return pinnedTools.length >= 2;
}

// Check if settings can be closed (returns true if valid, false with notification if invalid)
function canCloseSettings() {
	if (!validateToolsSelection()) {
		if (typeof showNotification === 'function') {
			notify('Please select at least 2 tools before closing settings.', false);
		} else {
			notify('Please select at least 2 tools before closing settings.');
		}
		return false;
	}
	// Clear previous state on successful close
	previousPinnedTools = null;
	return true;
}

// Initialize the tools pinning UI
function initializeToolsSelection() {
	const container = document.getElementById('tools-pinning-container');
	if (!container) {
		console.warn('Tools pinning container not found');
		return;
	}

	const pinnedTools = getPinnedTools();
	container.innerHTML = '';

	// Create a grid of tool cards (simple tap to select)
	const toolsGrid = document.createElement('div');
	toolsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
		margin-bottom: 2rem;
	`;

	// Create cards for all selectable tools (exclude Citations as it's always pinned)
	AVAILABLE_TOOLS.filter(tool => tool.id !== 'citations').forEach(tool => {
		const card = document.createElement('div');
		const isPinned = pinnedTools.includes(tool.id);
		const tabIndex = pinnedTools.indexOf(tool.id);

		card.style.cssText = `
			padding: 1.25rem 1rem;
			border: 2px solid ${isPinned ? 'var(--accent-color)' : 'var(--border-primary)'};
			border-radius: 0.5rem;
			background: ${isPinned ? 'var(--accent-color)' : 'var(--background-secondary)'};
			color: ${isPinned ? 'white' : 'var(--text-primary)'};
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 0.5rem;
			position: relative;
		`;

		// Add checkmark for selected tools
		if (isPinned) {
			const checkmark = document.createElement('div');
			checkmark.style.cssText = `
				position: absolute;
				top: 0.25rem;
				right: 0.25rem;
				width: 24px;
				height: 24px;
				background: ${isPinned ? 'white' : 'var(--accent-color)'};
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: bold;
				font-size: 0.75rem;
				color: var(--accent-color);
			`;
			checkmark.textContent = tabIndex + 2;
			card.appendChild(checkmark);
		}

		const icon = document.createElement('div');
		icon.style.cssText = 'font-size: 2rem;';
		icon.textContent = tool.icon;
		card.appendChild(icon);

		const name = document.createElement('div');
		name.style.cssText = `
			font-weight: 500;
			font-size: 0.875rem;
			line-height: 1.2;
		`;
		name.textContent = tool.name;
		card.appendChild(name);

		// Hover effect
		card.onmouseover = () => {
			if (!isPinned) {
				card.style.borderColor = 'var(--accent-color)';
				card.style.background = 'rgba(var(--accent-color-rgb), 0.1)';
			}
		};

		card.onmouseout = () => {
			if (!isPinned) {
				card.style.borderColor = 'var(--border-primary)';
				card.style.background = 'var(--background-secondary)';
			}
		};

		card.addEventListener('click', () => {
			if (isPinned) {
				// Unpin this tool
				const newPinned = pinnedTools.filter(id => id !== tool.id);
				savePinnedTools(newPinned);
			} else if (pinnedTools.length < 2) {
				// Pin this tool
				savePinnedTools([...pinnedTools, tool.id]);
			} else {
				// Replace the last pinned tool
				const newPinned = [...pinnedTools.slice(0, 1), tool.id];
				savePinnedTools(newPinned);
			}
			initializeToolsSelection();
		});

		toolsGrid.appendChild(card);
	});

	container.appendChild(toolsGrid);

	// Show preview of tab layout
	const preview = document.createElement('div');
	preview.style.cssText = `
		padding: 1.5rem;
		border-radius: 0.5rem;
		background: var(--background-secondary);
		border: 1px solid var(--border-primary);
	`;

	const previewTitle = document.createElement('div');
	previewTitle.style.cssText = 'font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);';
	previewTitle.textContent = 'Tab Layout Preview';
	preview.appendChild(previewTitle);

	const tabsDisplay = document.createElement('div');
	tabsDisplay.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';

	// Tab 1
	const tab1 = document.createElement('div');
	tab1.style.cssText = `
		padding: 0.5rem 1rem;
		background: var(--accent-color);
		color: white;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
	`;
	tab1.textContent = '📚 Citations';
	tabsDisplay.appendChild(tab1);

	// Tab 2 & 3
	for (let i = 0; i < 2; i++) {
		const toolId = pinnedTools[i];
		if (toolId) {
			const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
			if (tool) {
				const tab = document.createElement('div');
				tab.style.cssText = `
					padding: 0.5rem 1rem;
					background: var(--background-primary);
					color: var(--text-primary);
					border: 1px solid var(--border-primary);
					border-radius: 0.375rem;
					font-size: 0.875rem;
					font-weight: 500;
				`;
				tab.textContent = `${tool.icon} ${tool.name}`;
				tabsDisplay.appendChild(tab);
			}
		} else {
			// Show placeholder when no tool is selected for this slot
			const placeholder = document.createElement('div');
			placeholder.style.cssText = `
				padding: 0.5rem 1rem;
				background: var(--background-primary);
				color: var(--text-secondary);
				border: 1px dashed var(--border-primary);
				border-radius: 0.375rem;
				font-size: 0.875rem;
			`;
			placeholder.textContent = '+ Select a tool';
			tabsDisplay.appendChild(placeholder);
		}
	}

	preview.appendChild(tabsDisplay);
	container.appendChild(preview);
}

// Open settings and navigate to tools section
function openToolsSettingsPage() {
	storeCurrentSettings();
	toggleSettingsOverlay(true);
	setTimeout(() => {
		switchSettingsCategory('tools');
		initializeToolsSelection();
	}, 100);
}

// Developer Mode Functions
function toggleDeveloperMode(checked) {
	if (checked) {
		// Show warning modal with background overlay
		showNotification(
			'Enabling Developer Mode will grant access to advanced debugging tools and system information. Please note that modifying browser storage or cookies may affect the stability and security of your saved data. Proceed with caution.',
			true,
			() => {
				// User confirmed - save the setting and show developers section
				localStorage.setItem('developerMode', 'true');
				const devCategoryBtn = document.getElementById('developers-category-btn');
				const devDivider = document.getElementById('developers-divider');
				if (devCategoryBtn) {
					devCategoryBtn.style.display = 'flex';
				}
				if (devDivider) {
					devDivider.style.display = 'block';
				}
				notify('Developer Mode enabled');
			},
			'confirmation',
			() => {
				// User cancelled - uncheck the toggle
				document.getElementById('developerMode').checked = false;
			},
			{
				title: 'Enable Developer Mode',
				confirmButton: 'Yes, Enable',
				cancelButton: 'Cancel'
			}
		);
	} else {
		localStorage.setItem('developerMode', 'false');
		const devCategoryBtn = document.getElementById('developers-category-btn');
		const devDivider = document.getElementById('developers-divider');
		if (devCategoryBtn) {
			devCategoryBtn.style.display = 'none';
		}
		if (devDivider) {
			devDivider.style.display = 'none';
		}
		// If currently viewing developers category, switch to about
		const developersCategoryContent = document.querySelector('.settings-category-content[data-category="developers"]');
		if (developersCategoryContent && developersCategoryContent.classList.contains('active')) {
			switchSettingsCategory('about');
		}
		notify('Developer Mode disabled');
	}
}

function switchDevTab(tabId) {
	// Update button states
	document.querySelectorAll('.dev-tab-btn').forEach(btn => {
		if (btn.dataset.devTab === tabId) {
			btn.style.background = 'var(--accent-color)';
			btn.style.color = 'white';
			btn.classList.add('active');
		} else {
			btn.style.background = 'transparent';
			btn.style.color = 'var(--text-primary)';
			btn.classList.remove('active');
		}
	});

	// Update content
	const contentDiv = document.getElementById('dev-content');
	if (!contentDiv) return;

	if (tabId === 'localstorage') {
		let html = '<div style="margin-bottom: 0.75rem;"><button id="clear-all-storage-btn" onclick="confirmClearAllStorage()" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Clear All</button></div>';
		html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Key</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Value</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Action</th></tr></thead><tbody>';
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				let value = localStorage[key];
				try {
					const parsed = JSON.parse(value);
					if (typeof parsed === 'object' && parsed !== null) {
						value = JSON.stringify(parsed, null, 2);
					}
				} catch (e) {}
				html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary); word-break: break-word;">${key}</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary); word-break: break-word; max-width: 300px; overflow: auto;"><pre style="margin: 0; white-space: pre-wrap;">${value}</pre></td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><button onclick="confirmClearStorageItem('${key}')" style="padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;">Clear</button></td></tr>`;
			}
		}
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	} else if (tabId === 'system') {
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
			'Downlink': navigator.connection?.downlink ? `${navigator.connection.downlink} Mbps` : 'Unknown',
			'Current Location': window.location.href
		};
		let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Property</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Value</th></tr></thead><tbody>';
		for (let [key, value] of Object.entries(systemInfo)) {
			html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary); font-weight: 500;">${key}</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary); word-break: break-word;">${value}</td></tr>`;
		}
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	} else if (tabId === 'internalSettings') {
		const disableAnalytics = localStorage.getItem('lta_do_not_track') === 'true';
		const isPremium = localStorage.getItem('isPremium') === 'true';
		let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Setting</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Value</th></tr></thead><tbody>';
		html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">Disable Analytics</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><input type="checkbox" id="dev-disable-analytics" ${disableAnalytics ? 'checked' : ''} onchange="localStorage.setItem('lta_do_not_track', this.checked ? 'true' : 'false');"></td></tr>`;
		html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">Grant Pro</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><input type="checkbox" id="dev-grant-pro" ${isPremium ? 'checked' : ''} onchange="localStorage.setItem('isPremium', this.checked ? 'true' : 'false');"></td></tr>`;
		html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">Restart app as prod</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><button onclick="window.location.href = '/';" style="padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Restart</button></td></tr>`;
		html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">Restart app in debug mode</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><button onclick="window.location.href = window.location.href.split('?')[0] + '?dev=true';" style="padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Restart</button></td></tr>`;
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	} else if (tabId === 'devToolsSettings') {
		let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Setting</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Value</th></tr></thead><tbody>';
		html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">Open Floating Dev Tools</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><button onclick="if(document.getElementById('devToolsWindow')){document.getElementById('devToolsWindow').style.display='flex';}" style="padding: 0.5rem 1rem; background: var(--accent-color); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Open</button></td></tr>`;
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	} else if (tabId === 'console') {
		contentDiv.innerHTML = '<pre id="dev-console-output" style="background: var(--background-secondary); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.75rem; max-height: 300px; overflow-y: auto;">Console output will appear here...</pre>';
	} else if (tabId === 'errors') {
		let html = '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Time</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Error</th></tr></thead><tbody id="dev-errors-tbody">';
		html += '<tr><td colspan="2" style="padding: 0.5rem; border: 1px solid var(--border-primary); text-align: center; color: var(--text-secondary);">No errors recorded</td></tr>';
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	} else if (tabId === 'cookies') {
		let html = '<div style="margin-bottom: 0.75rem;"><button id="clear-all-cookies-btn" onclick="confirmClearAllCookies()" style="padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">Clear All</button></div>';
		html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;"><thead><tr style="background: var(--background-secondary);"><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Name</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Value</th><th style="padding: 0.5rem; text-align: left; border: 1px solid var(--border-primary);">Action</th></tr></thead><tbody>';
		const cookies = document.cookie.split(';');
		if (cookies.length === 1 && cookies[0] === '') {
			html += '<tr><td colspan="3" style="padding: 0.5rem; border: 1px solid var(--border-primary); text-align: center; color: var(--text-secondary);">No cookies found</td></tr>';
		} else {
			cookies.forEach(cookie => {
				if (cookie.trim()) {
					const [name, value] = cookie.split('=').map(part => part.trim());
					html += `<tr><td style="padding: 0.5rem; border: 1px solid var(--border-primary);">${name}</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary); word-break: break-word; max-width: 300px; overflow: auto;">${decodeURIComponent(value)}</td><td style="padding: 0.5rem; border: 1px solid var(--border-primary);"><button onclick="confirmClearCookie('${name}')" style="padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;">Clear</button></td></tr>`;
				}
			});
		}
		html += '</tbody></table>';
		contentDiv.innerHTML = html;
	}
}

// Initialize developer mode on settings load
function initializeDeveloperMode() {
	const developerMode = localStorage.getItem('developerMode') === 'true';
	const checkbox = document.getElementById('developerMode');
	const devCategoryBtn = document.getElementById('developers-category-btn');
	const devDivider = document.getElementById('developers-divider');
	const devModeToggle = document.getElementById('developer-mode-toggle');
	
	// Only show developer mode toggle on localhost:5500
	const isLocalDev = window.location.hostname === '127.0.0.1' && window.location.port === '5500';
	if (devModeToggle) {
		devModeToggle.style.display = isLocalDev ? 'flex' : 'none';
	}
	
	if (checkbox) {
		checkbox.checked = developerMode;
	}
	
	if (devCategoryBtn) {
		devCategoryBtn.style.display = developerMode ? 'flex' : 'none';
	}
	
	if (devDivider) {
		devDivider.style.display = developerMode ? 'block' : 'none';
	}
}

// Call initialization when settings overlay is opened
document.addEventListener('DOMContentLoaded', () => {
	setTimeout(initializeDeveloperMode, 500);
});

// Also initialize when switching to developers category
const originalSwitchSettingsCategory = window.switchSettingsCategory;
if (typeof originalSwitchSettingsCategory === 'function') {
	window.switchSettingsCategory = function(category) {
		originalSwitchSettingsCategory(category);
		if (category === 'developers') {
			// Initialize developer tools content when switching to developers tab
			setTimeout(() => switchDevTab('localstorage'), 100);
		}
	};
}

// Two-step confirmation for localStorage clear operations
let clearAllStorageConfirm = false;
let clearItemConfirm = {};

function confirmClearAllStorage() {
	const btn = document.getElementById('clear-all-storage-btn');
	if (!clearAllStorageConfirm) {
		btn.textContent = 'Click again to confirm';
		btn.style.background = '#dc2626';
		clearAllStorageConfirm = true;
		setTimeout(() => {
			if (clearAllStorageConfirm) {
				btn.textContent = 'Clear All';
				btn.style.background = '#ef4444';
				clearAllStorageConfirm = false;
			}
		}, 3000);
	} else {
		localStorage.clear();
		clearAllStorageConfirm = false;
		switchDevTab('localstorage');
	}
}

function confirmClearStorageItem(key) {
	if (!clearItemConfirm[key]) {
		const btn = event.target;
		btn.textContent = 'Confirm?';
		btn.style.background = '#dc2626';
		clearItemConfirm[key] = true;
		setTimeout(() => {
			if (clearItemConfirm[key]) {
				btn.textContent = 'Clear';
				btn.style.background = '#ef4444';
				clearItemConfirm[key] = false;
			}
		}, 3000);
	} else {
		localStorage.removeItem(key);
		clearItemConfirm[key] = false;
		switchDevTab('localstorage');
	}
}

// Two-step confirmation for cookies clear operations
let clearAllCookiesConfirm = false;
let clearCookieConfirm = {};

function confirmClearAllCookies() {
	const btn = document.getElementById('clear-all-cookies-btn');
	if (!clearAllCookiesConfirm) {
		btn.textContent = 'Click again to confirm';
		btn.style.background = '#dc2626';
		clearAllCookiesConfirm = true;
		setTimeout(() => {
			if (clearAllCookiesConfirm) {
				btn.textContent = 'Clear All';
				btn.style.background = '#ef4444';
				clearAllCookiesConfirm = false;
			}
		}, 3000);
	} else {
		document.cookie.split(';').forEach(c => {
			const [name] = c.split('=');
			document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
		});
		clearAllCookiesConfirm = false;
		switchDevTab('cookies');
	}
}

function confirmClearCookie(name) {
	if (!clearCookieConfirm[name]) {
		const btn = event.target;
		btn.textContent = 'Confirm?';
		btn.style.background = '#dc2626';
		clearCookieConfirm[name] = true;
		setTimeout(() => {
			if (clearCookieConfirm[name]) {
				btn.textContent = 'Clear';
				btn.style.background = '#ef4444';
				clearCookieConfirm[name] = false;
			}
		}, 3000);
	} else {
		document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
		clearCookieConfirm[name] = false;
		switchDevTab('cookies');
	}
}