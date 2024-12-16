var timeoutId;
var progressIntervalId;
var timeLeft = 5000;
var isPaused = false;

function notify(message) {
    var notification = document.getElementById("notification");
    var progressBar = document.getElementById("progress-bar");
    notification.firstChild.nodeValue = message;
    notification.classList.add("show");
    progressBar.style.width = '100%';
    timeLeft = 5000;
    isPaused = false;

    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    if (progressIntervalId) {
        clearInterval(progressIntervalId);
    }

    // Set a new timeout for notification
    function startTimeout() {
        timeoutId = setTimeout(function () {
            notification.classList.remove("show");
            notification.style.opacity = 0;
            setTimeout(function () { notification.style.opacity = ""; }, 1000);
        }, timeLeft + 100);
    }
    startTimeout();

    // Start progress bar countdown
    function startProgressBar() {
        progressIntervalId = setInterval(function () {
            if (!isPaused) {
                timeLeft -= 100;
                progressBar.style.width = (timeLeft / 5000) * 100 + "%";
                if (timeLeft <= 0) {
                    clearInterval(progressIntervalId);
                }
            }
        }, 100);
    }
    startProgressBar();

    // Add hover events
    notification.onmouseenter = function() {
        isPaused = true;
        clearTimeout(timeoutId);
    };

    notification.onmouseleave = function() {
        isPaused = false;
        startTimeout();
    };

    // Click event to dismiss
    notification.onclick = function () {
        notification.classList.remove("show");
        notification.style.opacity = 0;
        clearInterval(progressIntervalId);
        clearTimeout(timeoutId);
        setTimeout(function () { notification.style.opacity = ""; }, 1000);
    };
}