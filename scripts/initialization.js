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
	
	UpdateCounts();
	console.log("App initialized.")
};

window.addEventListener('resize', function() {
		if (window.innerWidth < 768) {
				document.querySelector('textarea').style.height = ""; 
		} else {
				document.querySelector('textarea').style.width = "";
		}
});

window.addEventListener('beforeunload', function (e) {
	if (localStorage.getItem('autoSave') == 'disabled' || localStorage.getItem('AutoSave') == 'disabled') {
		var confirmationMessage = 'AutoSave is not enabled. Are you sure you want to leave?';
		e.returnValue = confirmationMessage;
		return confirmationMessage; 
	}
});
