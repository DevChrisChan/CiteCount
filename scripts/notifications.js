var timeoutId;
    var progressIntervalId;

    function notify(message) {
        var notification = document.getElementById("notification");
        var progressBar = document.getElementById("progress-bar");
        notification.firstChild.nodeValue = message; // Set the message
        
        // Show notification and reset progress bar
        notification.classList.add("show");
        progressBar.style.width = '100%'; // Reset progress bar

        // Clear any existing timeouts and intervals
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (progressIntervalId) {
            clearInterval(progressIntervalId);
        }

        // Set a new timeout for notification
        timeoutId = setTimeout(function () {
            notification.classList.remove("show");
            notification.style.opacity = 0;
            setTimeout(function () { notification.style.opacity = ""; }, 1000);
        }, 5300);

        // Start progress bar countdown
        var timeLeft = 5000;
        progressIntervalId = setInterval(function () {
            timeLeft -= 100;
            progressBar.style.width = (timeLeft / 5000) * 100 + "%";
            if (timeLeft <= 0) {
                clearInterval(progressIntervalId);
            }
        }, 100);

        notification.onclick = function () {
            notification.classList.remove("show");
            notification.style.opacity = 0;
            clearInterval(progressIntervalId);
            setTimeout(function () { notification.style.opacity = ""; }, 1000);
        };
    }
