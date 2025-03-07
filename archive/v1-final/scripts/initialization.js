
function getTimestamp() {
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');
	return `[${hours}:${minutes}:${seconds}]`;
}
let startTime;
document.addEventListener("DOMContentLoaded", function () {
	startTime = performance.now();
	console.log(getTimestamp() + " Initializing app...")
	// Dev

	if (localStorage.getItem('dev') === 'enabled') {
		enableDev();
	}
});

window.onload = function () {
	var version = '2.1 (2B34b)';
	document.getElementById('version').textContent = version;

	/*const url = 'https://raw.githubusercontent.com/DevChrisChan/Notifications/refs/heads/main/notification.txt';

	setTimeout(function() {
		fetch(url)
			.then(response => {
				if (!response.ok) throw new Error('Error fetching notifications');
				return response.text();
			})
			.then(data => {
				document.getElementById('content').innerHTML = data; // Use innerHTML to parse HTML content
				document.getElementById('banner').style.display = 'block'; // Show the banner
			})
			.catch(error => {
				document.getElementById('content').innerText = 'Failed to load content: ' + error.message;
				document.getElementById('banner').style.display = 'block'; // Show the banner even if there's an error
			});
	}, 1000); // 1000 milliseconds = 1 second

	document.getElementById('dismissButton').onclick = function() {
		document.getElementById('banner').style.display = 'none'; // Hide the banner on click
	};
	*/

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
		document.getElementById('landing-section').style.display = 'none';
		document.getElementById('secondary-landing').style.display = 'none';
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

	if (window.innerHeight < 500 && window.innerWidth <= 767) {
		if (localStorage.getItem('Focus') === 'disabled') {
			notify('Problems using CiteCount? Enable Focus in settings.')
		}
	}

	var citationsCounter = document.getElementById("Citations");

	citationsCounter.onclick = function () {
		citationsModal.classList.add("show");
	}

	if (!localStorage.getItem('Version')) {
		localStorage.setItem('Version', version);
	}

	if (localStorage.getItem('Version') !== version) {
		notify('CiteCount has been automatically updated to version ' + version + '.')
		localStorage.setItem('Version', version);
		console.log(getTimestamp() + ' CiteCount updated to version ' + version + '.')
	}
	UpdateCounts();
	if (localStorage.getItem('reset') === 'true') {
		notify('CiteCount has been reset.')
		localStorage.removeItem('reset');
	}
	const endTime = performance.now();
	const timeTaken = (endTime - startTime).toFixed(2);
	// Mobile Safari viewport height fix
	function setVH() {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}
	setVH();
	window.addEventListener('resize', setVH);
	window.addEventListener('orientationchange', setVH);
	console.log(getTimestamp() + ` App initialized. (${timeTaken} ms)`)
	if (localStorage.getItem('dev') === 'enabled') {
		notify(`App initialized in Developer Mode. (Took ${timeTaken} ms)`)
	}
};

window.addEventListener('beforeunload', function (e) {
	var rawData = document.getElementById("rawData").value;
	if (localStorage.getItem('autoSave') == 'disabled' && localStorage.getItem('Warn') == 'enabled' && rawData.trim().length > 0) {
		var confirmationMessage = 'AutoSave is not enabled. Are you sure you want to leave?';
		e.returnValue = confirmationMessage;
		return confirmationMessage;
	}
});

window.onerror = function (message, source, lineno, colno, error) {
	const errorMessage = `An error occured, please contact the developers.\n` + `Error: ${message}\n` +
		`Source: ${source}\n` +
		`Line: ${lineno}\n` +
		`Column: ${colno}\n` +
		`Stack: ${error ? error.stack : 'N/A'}`;
	notify(errorMessage)
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

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then((registration) => {
				console.log(getTimestamp() + ' CiteCount is ready to run offline.');
			})
			.catch((error) => {
				console.error(getTimestamp() + ' There is an error while installing CiteCount for offline use:', error);
			});
	});
}

/*
function getPWADisplayMode() {
	if (window.matchMedia('(display-mode: standalone)').matches)
	  return 'standalone';
	if (window.matchMedia('(display-mode: fullscreen)').matches)
		return 'fullscreen';
	return 'unknown';
  }

  window.addEventListener('DOMContentLoaded', () => {
	if(getPWADisplayMode() === 'standalone') {
		document.getElementById('landing-section').style.display = 'none';
		document.getElementById('secondary-landing').style.display = 'none';
		localStorage.setItem('Focus', 'enabled');
		notify('Focus is enabled as a standalone app.')
	}
	if(getPWADisplayMode() === 'fullscreen') {
		document.getElementById('landing-section').style.display = 'none';
		document.getElementById('secondary-landing').style.display = 'none';
		localStorage.setItem('Focus', 'enabled');
		notify('Focus is enabled in fullscreen.')
	}
  });

  window.addEventListener('resize', function(){
	if(getPWADisplayMode() === 'fullscreen') {
		document.getElementById('landing-section').style.display = 'none';
		document.getElementById('secondary-landing').style.display = 'none';
		localStorage.setItem('Focus', 'enabled');
		notify('Focus is enabled in fullscreen.')
	}
	else {
		document.getElementById('landing-section').style.display = 'block';
		document.getElementById('secondary-landing').style.display = 'block';
		localStorage.setItem('Focus', 'disabled');
	}
  });*/