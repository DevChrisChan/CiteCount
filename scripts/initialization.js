var version = '2.0 (2A26c)';
document.getElementById('version').innerText = version;

document.addEventListener("DOMContentLoaded", function() {
	console.log("Initializing app...")
});

window.onload = function() {
	document.getElementById("rawData").focus();

	// Settings

	if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
		var savedText = localStorage.getItem('rawData');
		if (savedText) {
				document.getElementById('rawData').value = savedText;
				notify("Successfully restored from AutoSave.")
		}
	}
	if (localStorage.getItem('Focus') === 'enabled') {
		document.getElementById('lander').style.display = 'none';
	}
	if (localStorage.getItem('WordsWithoutCitations') === 'disabled') {
		document.getElementById('WordsWithoutCitations').style.display = 'none';
	}
	if (localStorage.getItem('CharsWithoutCitations') === 'disabled') {
		document.getElementById('CharsWithoutCitations').style.display = 'none';
	}
	if (localStorage.getItem('WordsWithCitations') === 'disabled') {
		document.getElementById('WordsWithCitations').style.display = 'none';
	}
	if (localStorage.getItem('CharsWithCitations') === 'disabled') {
		document.getElementById('CharsWithCitations').style.display = 'none';
	}
	if (localStorage.getItem('Citations') === 'disabled') {
		document.getElementById('Citations').style.display = 'none';
	}
	
	if (window.innerHeight < 500 && window.innerWidth <= 767 ) {
		if (localStorage.getItem('Focus') === 'disabled'){
			notify('Problems using CiteCount? Enable Focus in settings.')
		}	
	}
	
	var citationsCounter = document.getElementById("Citations");

	citationsCounter.onclick = function() {
		citationsModal.classList.add("show");
	}

	if(!localStorage.getItem('Version')) {
		localStorage.setItem('Version', version);
	}

	if(localStorage.getItem('Version') !== version) {
		notify('CiteCount has been automatically updated to version ' + version + '.')
		localStorage.setItem('Version', version);
	}
	
	UpdateCounts();
	console.log("App initialized.")
};

window.addEventListener('beforeunload', function (e) {
	var rawData = document.getElementById("rawData").value;
	if (localStorage.getItem('autoSave') == 'disabled' && localStorage.getItem('Warn') == 'enabled' && rawData.trim().length > 0) {
		var confirmationMessage = 'AutoSave is not enabled. Are you sure you want to leave?';
		e.returnValue = confirmationMessage;
		return confirmationMessage; 
	}
});

window.onerror = function(source) {
		if (source === 'https://liteanalytics.com/lite.js') {
				return true;
		}
};

window.addEventListener("offline", () => {
	notify("CiteCount is now working offline. You can keep using with full functionality.")
});

window.addEventListener("online", () => {
	notify("CiteCount is now working online.")
});