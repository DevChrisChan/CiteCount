function normalizePdfText(text) {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/[ \t]+([,.;:!?])/g, '$1')
		.replace(/([([{])[ \t]+/g, '$1')
		.replace(/[ \t]+([)\]])/g, '$1')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function buildPdfPageText(content) {
	const lines = [];
	let lineParts = [];

	content.items.forEach((item) => {
		const value = item && item.str ? item.str : '';
		if (value) {
			lineParts.push(value);
		}
		if (item && item.hasEOL) {
			lines.push(lineParts.join(' '));
			lineParts = [];
		}
	});

	if (lineParts.length > 0) {
		lines.push(lineParts.join(' '));
	}

	return lines.join('\n');
}

function extractPdfTextFromFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async function (e) {
			try {
				const typedarray = new Uint8Array(e.target.result);
				const pdf = await pdfjsLib.getDocument(typedarray).promise;
				let text = '';
				for (let i = 1; i <= pdf.numPages; i++) {
					const page = await pdf.getPage(i);
					const content = await page.getTextContent();
					const pageText = buildPdfPageText(content);
					text += pageText;
					if (i < pdf.numPages) {
						text += '\n\n';
					}
				}
				resolve(normalizePdfText(text));
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};
		reader.readAsArrayBuffer(file);
	});
}

function processFileWithProgress(file, fileId, callback) {
	const editor = document.getElementById('editor');
	const welcomeText = document.getElementById('welcome-text');
  
	// Check file type first - note: .doc (legacy Word) is not supported, only .docx
	const isValidType = file.type === 'application/pdf' || 
											file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
											file.type === 'text/plain';
  
	// Check for .doc files specifically to provide helpful error message
	if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
		callback(false, 'Legacy .doc files are not supported. Please save your document as .docx (Word 2007 or later format) and try again.', null);
		return;
	}
  
	if (!isValidType) {
		callback(false, 'Unsupported file type. Only .docx, .pdf, and .txt files are supported.', null);
		return;
	}
  
	// Check if scripts are already loaded
	if (typeof pdfjsLib === 'undefined' || typeof mammoth === 'undefined') {
		loadScriptsOnDemand(() => {
			processFileContent(file, editor, welcomeText, fileId, callback);
		});
	} else {
		processFileContent(file, editor, welcomeText, fileId, callback);
	}
}

function processFileContent(file, editor, welcomeText, fileId, callback) {
	const fileNameWithoutExt = file.name.replace(/\.(pdf|docx|txt)$/i, '');
  
	// Always create a new project for each file in batch import
	let newProjectId;
	if (typeof fileManager !== 'undefined') {
		// Don't auto-switch to avoid jumping between projects during batch import
		newProjectId = fileManager.createProject(fileNameWithoutExt, false);
	}
  
	if (file.type === 'text/plain') {
		// Handle .txt files
		const reader = new FileReader();
		reader.onload = function (e) {
			const text = e.target.result;
      
			// Save content to the new project
			if (newProjectId && typeof fileManager !== 'undefined') {
				const project = fileManager.projects.find(p => p.id === newProjectId);
				if (project) {
					project.content = text;
					fileManager.saveToStorage();
					// Update file item with projectId
					const fileItem = document.getElementById(fileId);
					if (fileItem) fileItem.dataset.projectId = newProjectId;
				}
			}
      
			callback(true, null, newProjectId);
		};
		reader.onerror = () => {
			callback(false, 'Failed to read text file', null);
		};
		reader.readAsText(file);
	} else if (file.type === 'application/pdf') {
		extractPdfTextFromFile(file)
			.then((text) => {
				// Save content to the new project
				if (newProjectId && typeof fileManager !== 'undefined') {
					const project = fileManager.projects.find(p => p.id === newProjectId);
					if (project) {
						project.content = text;
						fileManager.saveToStorage();
						// Update file item with projectId
						const fileItem = document.getElementById(fileId);
						if (fileItem) fileItem.dataset.projectId = newProjectId;
					}
				}
        
				callback(true, null, newProjectId);
			})
			.catch((err) => {
				console.error('PDF processing error:', err);
				const message = err && err.message ? err.message : 'Unknown error';
				callback(false, 'Error reading PDF file: ' + message, null);
			});
	} else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
		const reader = new FileReader();
		reader.onload = function (e) {
			mammoth.extractRawText({ arrayBuffer: e.target.result })
				.then(result => {
					// Save content to the new project
					if (newProjectId && typeof fileManager !== 'undefined') {
						const project = fileManager.projects.find(p => p.id === newProjectId);
						if (project) {
							project.content = result.value;
							fileManager.saveToStorage();
							// Update file item with projectId
							const fileItem = document.getElementById(fileId);
							if (fileItem) fileItem.dataset.projectId = newProjectId;
						}
					}
					callback(true, null, newProjectId);
				})
				.catch(err => {
					console.error('DOCX processing error:', err);
					callback(false, 'Error reading DOCX file: ' + err.message, null);
				});
		};
		reader.onerror = () => {
			callback(false, 'Failed to read file', null);
		};
		reader.readAsArrayBuffer(file);
	}
}

function loadScriptsOnDemand(callback) {
	const scripts = [
			"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js"
	];
  
	let loadedCount = 0;
	scripts.forEach(src => {
			const script = document.createElement("script");
			script.src = src;
			script.async = true;
			script.onload = () => {
					loadedCount++;
					if (loadedCount === scripts.length) callback();
			};
			document.body.appendChild(script);
	});
}

function handleFileDrop(file) {
	const editor = document.getElementById('editor');
	const welcomeText = document.getElementById('welcome-text');

	// Check if scripts are already loaded
	if (typeof pdfjsLib === 'undefined' || typeof mammoth === 'undefined') {
			loadScriptsOnDemand(() => {
					processFile(file, editor, welcomeText); // Process file after scripts load
			});
	} else {
			processFile(file, editor, welcomeText); // Scripts already loaded, process immediately
	}
}

function processFile(file, editor, welcomeText) {
	// Check if current project has content
	const hasExistingContent = editor.innerText.trim().length > 0;
	const fileNameWithoutExt = file.name.replace(/\.(pdf|docx|txt)$/i, '');
  
	// Check for .doc files specifically to provide helpful error message
	if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
		notify('Legacy .doc files are not supported. Please save your document as .docx (Word 2007 or later format) and try again.');
		return;
	}
  
	if (file.type === 'text/plain') {
		// Handle .txt files
		const reader = new FileReader();
		reader.onload = function (e) {
			const text = e.target.result;
      
			// If project has content, create new project; otherwise use current
			if (hasExistingContent && typeof fileManager !== 'undefined') {
				const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
				// The createProject with autoSwitch will handle loading the new project
				editor.innerText = text;
			} else {
				editor.innerText = text;
				// Update current project name to match filename
				if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
					fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
				}
			}
      
			welcomeText.style.display = 'none';
			handleEditorInput();
			notify(`${file.name} has been imported successfully!`);
		};
		reader.onerror = () => {
			notify('Failed to read text file');
		};
		reader.readAsText(file);
	} else if (file.type === 'application/pdf') {
			extractPdfTextFromFile(file)
				.then((text) => {
					// If project has content, create new project; otherwise use current
					if (hasExistingContent && typeof fileManager !== 'undefined') {
						const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
						// The createProject with autoSwitch will handle loading the new project
						editor.innerText = text;
					} else {
						editor.innerText = text;
						// Update current project name to match filename
						if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
							fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
						}
					}
          
					welcomeText.style.display = 'none';
					handleEditorInput();
					notify(`${file.name} has been imported successfully!`);
				})
				.catch((err) => {
					const message = err && err.message ? err.message : 'Unknown error';
					notify('Error reading PDF file: ' + message);
				});
	} else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
			const reader = new FileReader();
			reader.onload = function (e) {
					mammoth.extractRawText({ arrayBuffer: e.target.result })
							.then(result => {
									// If project has content, create new project; otherwise use current
									if (hasExistingContent && typeof fileManager !== 'undefined') {
										const newProjectId = fileManager.createProject(fileNameWithoutExt, true);
										// The createProject with autoSwitch will handle loading the new project
										editor.innerText = result.value;
									} else {
										editor.innerText = result.value;
										// Update current project name to match filename
										if (typeof fileManager !== 'undefined' && fileManager.currentProject) {
											fileManager.renameProject(fileManager.currentProject, fileNameWithoutExt);
										}
									}
                  
									welcomeText.style.display = 'none';
									handleEditorInput();
									notify(`${file.name} has been imported successfully!`);
							})
							.catch(err => {
									notify('Error reading DOCX file: ' + err.message);
							});
			};
			reader.readAsArrayBuffer(file);
	} else {
			notify('Unsupported file type. Please use .docx, .pdf, or .txt files.');
	}
}

function handleFileUpload(event) {
	const files = event.target.files;
	if (files && files.length > 0) {
		handleMultipleFilesDrop(files);
	}
	// Reset the input so the same file can be selected again
	event.target.value = '';
}
