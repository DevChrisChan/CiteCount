function WordCount(str) {
	str = str.trim();
	return str.length > 0 ? str.split(/\s+/).length : 0;
}


function UpdateCounts() {
	var rawText = document.getElementById("rawData").value;
	var formattedText = rawText.replace(/\s*\(.*?\)\s*/g, '');
	document.getElementById("formattedData").value = formattedText;

	var wordCountNoCitations = WordCount(formattedText);
	var charCountNoCitations = formattedText.length;
	var wordCountWithCitations = WordCount(rawText);
	var charCountWithCitations = rawText.length;
	var citationCount = (rawText.match(/\(.*?\)/g) || []).length;

	document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
	document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
	document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
	document.getElementById("charCountWithCitationsValue").innerText = charCountWithCitations;
	document.getElementById("citationCountValue").innerText = citationCount;

	localStorage.setItem('rawData', rawText);
}

function notify(message) {
		var notification = document.getElementById("notification");
		notification.textContent = message;
		notification.className = "show";
		setTimeout(function(){ 
				notification.className = ""; 
				notification.style.opacity = 0; 
				setTimeout(function(){ notification.style.opacity = ""; }, 1000); 
		}, 3000);

		notification.onclick = function() {
				notification.className = "";
				notification.style.opacity = 0;
				setTimeout(function(){ notification.style.opacity = ""; }, 1000);
		}
}

function setActiveAppearance(appearance) {
	var button = document.getElementById(appearance);
	if (button) {
		button.classList.add('active');
	} else {
		console.log("No button with id: " + appearance);
	}
}

window.onload = function() {
	console.log("App initialized.")
	var savedText = localStorage.getItem('rawData');
	if (savedText) {
		document.getElementById('rawData').value = savedText;
		notify("Sucessfully restored from AutoSave.")
	}

	var appearanceSettings = localStorage.getItem('appearanceSettings');
	if (appearanceSettings) {
		setActiveAppearance(appearanceSettings);
	} else {
		console.log("Initializing app... Setting appearance settings.")
		localStorage.setItem('appearanceSettings', 'system');
		setActiveAppearance('system');
	}
	
	UpdateCounts();
	 document.getElementById("rawData").focus();
};

window.addEventListener('resize', function() {
		if (window.innerWidth < 768) {
				document.querySelector('textarea').style.height = ""; 
		} else {
				document.querySelector('textarea').style.width = "";
		}
});

document.addEventListener("DOMContentLoaded", function() {
	console.log("Initializing app...")
});

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

