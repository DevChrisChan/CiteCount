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
	if (event.target == citationsModal) {
		citationsModal.classList.remove("show");
	}
}

document.onkeydown = function(event) {
	var isEscape = false;
	if ("key" in event) {
		isEscape = (event.key === "Escape" || event.key === "Esc");
	} else {
		isEscape = (event.keyCode === 27);
	}
	if (isEscape) {
		if (modal.classList.contains('show')) {
			modal.classList.remove("show");
		}
		if (citationsModal.classList.contains('show')) {
			citationsModal.classList.remove("show");
		}
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

settings.forEach(setting => {
	const enableButton = document.getElementById('enable' + setting.id);
	const disableButton = document.getElementById('disable' + setting.id);

	const handleClick = (state, activeButton, inactiveButton) => {
		let message = `${setting.name} is ${state}.`;
		notify(message);
		localStorage.setItem(setting.id, state);
		activeButton.classList.add('active');
		inactiveButton.classList.remove('active');
		activeButton.textContent = state.charAt(0).toUpperCase() + state.slice(1);
		inactiveButton.textContent = state === 'enabled' ? 'Disable' : 'Enable';
		applySetting(setting.id, state);
	};

	enableButton.onclick = () => handleClick('enabled', enableButton, disableButton);
	disableButton.onclick = () => handleClick('disabled', disableButton, enableButton);

	if (!localStorage.getItem(setting.id)) {
		localStorage.setItem(setting.id, setting.default);
	}

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
			document.getElementById('lander').style.display = state === 'enabled' ? 'none' : 'block';
			break;
		case 'WordsWithoutCitations':
		case 'CharsWithoutCitations':
		case 'WordsWithCitations':
		case 'CharsWithCitations':
		case 'Citations':
			document.getElementById(id).style.display = state === 'enabled' ? 'block' : 'none';
			break;
		case 'Spellcheck':
			document.getElementById("rawData").spellcheck = state === 'enabled';
			break;
		case 'autoSave':
			localStorage.setItem('rawData', state === 'enabled' ? document.getElementById("rawData").value : '');
			break;
	}
}
