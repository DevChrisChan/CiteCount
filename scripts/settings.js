var modal = document.getElementById("settingsModal");
var btn = document.querySelector(".about-link");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
	modal.classList.add("show");
}

span.onclick = function() {
	modal.classList.remove("show");
}

window.onclick = function(event) {
	if (event.target == modal) {
		modal.classList.remove("show");
	}
}

document.onkeydown = function(event) {
	var isEscape = false;
	if ("key" in event) {
		isEscape = (event.key === "Escape" || event.key === "Esc");
	} else {
		isEscape = (event.keyCode === 27);
	}
	if (isEscape && modal.classList.contains('show')) {
		modal.classList.remove("show");
	}
};

// Settings
// Define the settings
var settings = [
	{ name: 'AutoSave', id: 'autoSave', default: 'enabled' },
	{ name: 'Warn on leave', id: 'Warn', default: 'enabled' },
	{ name: 'Spell check', id: 'Spellcheck', default: 'enabled' },
	{ name: 'Focus', id: 'Focus', default: 'disabled' },
	{ name: 'Words without citations counter', id: 'WordsWithoutCitations', default: 'enabled' },
	{ name: 'Characters without citations counter', id: 'CharsWithoutCitations', default: 'enabled' },
	{ name: 'Words with citations counter', id: 'WordsWithCitations', default: 'enabled' },
	{ name: 'Characters with citations counter', id: 'CharsWithCitations', default: 'enabled' },
	{ name: 'Citations counter', id: 'Citations', default: 'enabled' }
];

settings.forEach(function(setting) {
	var enableButton = document.getElementById('enable' + setting.id);
	var disableButton = document.getElementById('disable' + setting.id);
	enableButton.onclick = function() {
		var message = setting.name + " is enabled.";
		localStorage.setItem(setting.id, 'enabled');
		this.classList.add('active');
		disableButton.classList.remove('active');
		this.textContent = 'Enabled';
		disableButton.textContent = 'Disable';
		applySetting(setting.id, 'enabled');
		if (setting.id === 'WordsWithoutCitations' || setting.id === 'CharsWithoutCitations' || setting.id === 'WordsWithCitations' || setting.id === 'CharsWithCitations' || setting.id === 'Citations') {
			message = setting.name + " is enabled. Please reload for settings to take effect.";
		}
		notify(message);
	}

	disableButton.onclick = function() {
		var message = setting.name + " is disabled.";
		if (setting.id === 'WordsWithoutCitations' || setting.id === 'CharsWithoutCitations' || setting.id === 'WordsWithCitations' || setting.id === 'CharsWithCitations' || setting.id === 'Citations') {
			message = setting.name + " is disabled. Please reload for settings to take effect.";
		}
		notify(message);
		localStorage.setItem(setting.id, 'disabled');
		this.classList.add('active');
		enableButton.classList.remove('active');
		this.textContent = 'Disabled';
		enableButton.textContent = 'Enable';
		applySetting(setting.id, 'disabled');
	}

	// Set default settings
	if (!localStorage.getItem(setting.id)) {
		localStorage.setItem(setting.id, setting.default);
	}

	// Highlight appropriate settings on load
	if (localStorage.getItem(setting.id) === 'enabled') {
		enableButton.classList.add('active');
		enableButton.textContent = 'Enabled';
	} else {
		disableButton.classList.add('active');
		disableButton.textContent = 'Disabled';
	}
});


function applySetting(id, state) {
	switch (id) {
		case 'Focus':
			applyFocus(state);
			break;
	}
	switch (id) {
		case 'Spellcheck':
			applySpellcheck(state);
			break;
	}
}

function applyFocus(state) {
	if (state === 'enabled') {
		document.getElementById('lander').style.display = 'none';
	}
	else if (state === 'disabled') {
		document.getElementById('lander').style.display = 'block';
	}
}

function applySpellcheck(state) {
	if (state === 'enabled') {
		document.getElementById("rawData").spellcheck = true;
	}
	else if (state === 'disabled') {
		document.getElementById("rawData").spellcheck = false;
	}
}