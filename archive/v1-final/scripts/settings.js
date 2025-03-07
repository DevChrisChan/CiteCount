var modal = document.getElementById("settingsModal");
var btn = document.querySelector(".about-link");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
	modal.classList.add("show");
}

document.addEventListener('keydown', function(event) {
		if ((event.ctrlKey || event.metaKey) && event.key === ',') {
			modal.classList.add("show");
			event.preventDefault();
		}
});

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
	if (event.target == shortcutsModal) {
		shortcutsModal.classList.remove("show");
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
		if (shortcutsModal.classList.contains('show')) {
			shortcutsModal.classList.remove("show");
		}
	}
};

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
			let currentState = localStorage.getItem(setting.id);
			if (currentState !== state) {
				let message = `${setting.name} is ${state}.`;
				notify(message);
				localStorage.setItem(setting.id, state);
				activeButton.classList.add('active');
				inactiveButton.classList.remove('active');
				activeButton.textContent = state.charAt(0).toUpperCase() + state.slice(1);
				inactiveButton.textContent = state === 'enabled' ? 'Disable' : 'Enable';
				applySetting(setting.id, state);
			}
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
			document.getElementById('landing-section').style.display = state === 'enabled' ? 'none' : 'block';
			document.getElementById('secondary-landing').style.display = state === 'enabled' ? 'none' : 'block';
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

document.addEventListener('keydown', function(event) {
	if ((event.ctrlKey || event.metaKey) && event.key === '/') {
		shortcutsModal.classList.add("show");
		event.preventDefault();
	}
});

function showDialog() {
    document.getElementById('custom-dialog').style.display = 'flex';
}

function confirmReset() {
    showDialog();
}

document.getElementById('confirm-button').onclick = function() {
    localStorage.clear();
	localStorage.setItem('reset', 'true');
	location.reload();
};

document.getElementById('cancel-button').onclick = function() {
    document.getElementById('custom-dialog').style.display = 'none';
};

let clickCount = 0;

    document.getElementById('devtoggle').addEventListener('click', function() {
        clickCount++;
        if (clickCount === 5) {
		
            localStorage.setItem('dev', 'enabled');
            notify('Restarting soon for effects to take.');

            setTimeout(function() {
                document.getElementById("rawData").value = "";
                localStorage.removeItem('rawData');
            }, 300);

            setTimeout(function() {
                window.location.reload();
            }, 500);
	}
    });
