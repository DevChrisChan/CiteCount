var timeoutId;

function notify(message) {
		var notification = document.getElementById("notification");
		notification.textContent = message;
		notification.className = "show";

		// Clear any existing timeouts
		if (timeoutId) {
				clearTimeout(timeoutId);
		}

		// Set a new timeout
		timeoutId = setTimeout(function(){ 
				notification.className = ""; 
				notification.style.opacity = 0; 
				setTimeout(function(){ notification.style.opacity = ""; }, 1000); 
		}, 5000);

		notification.onclick = function() {
				notification.className = "";
				notification.style.opacity = 0;
				setTimeout(function(){ notification.style.opacity = ""; }, 1000);
		}
}
