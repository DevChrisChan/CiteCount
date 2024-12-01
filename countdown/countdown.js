let targetDate;
let interval;
let examDates = []; // Declare examDates globally

// Fetch the exam dates
async function fetchExamDates() {
    try {
        const response = await fetch('/countdown/dates.json');
        examDates = await response.json(); // Store exam dates in the global variable

        const select = document.getElementById('examSelect');
        examDates.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.date; // Store the exam date
            option.textContent = `${exam.name} - ${new Date(exam.date).toLocaleDateString()}`;
            option.setAttribute('data-id', exam.id); // Store exam ID in a data attribute
            select.appendChild(option);
        });

        // Automatically select exam based on query string
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('exam'); // Get examId from the URL as a string

        if (examId) { // Check if examId is provided in the URL
            // Find the selected exam using string comparison
            const selectedExam = examDates.find(exam => exam.id === examId); 

            // Only proceed if selectedExam is found
            if (selectedExam) {
                // Set the dropdown value based on the selected exam
                const selectedOption = select.querySelector(`option[data-id="${selectedExam.id}"]`);
                if (selectedOption) {
                    select.value = selectedOption.value; // Set the dropdown to the selected exam's date
                    targetDate = new Date(selectedOption.value).getTime(); // Set targetDate based on exam's date
                    updateCountdown(); // Start the countdown immediately
                } else {
                    console.error('Selected option not found in dropdown.');
                }
            } else {
                console.log('No valid exam found for the provided ID.'); // Handle case if examId is not valid
            }
        } else {
            console.log('No exam ID provided in URL. Setting to default exam ID 1.');
            // Set to the first exam by default
            if (examDates.length > 0) {
                const defaultExam = examDates[0];
                const defaultOption = select.querySelector(`option[data-id="${defaultExam.id}"]`);
                select.value = defaultOption.value; // Set the dropdown to the first exam's date
                targetDate = new Date(defaultOption.value).getTime(); // Set targetDate based on first exam's date
                updateCountdown(); // Start the countdown immediately
            } else {
                console.error('No exam dates available to set as default.');
            }
        }

    } catch (error) {
        console.error('Error loading exam dates:', error);
    }
}

function updateCountdown() {
    if (!targetDate) return;

    function update() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            clearInterval(interval);
            document.querySelector('.countdown').innerHTML = '<h2>The IB Exams have started!</h2>';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(3, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }

    if (interval) {
        clearInterval(interval);
    }

    update(); // Update immediately before starting the interval
    interval = setInterval(update, 1000);
}

document.getElementById('examSelect').addEventListener('change', function(e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const selectedExamId = selectedOption.getAttribute('data-id'); // Get selected exam ID as string
    targetDate = new Date(selectedOption.value).getTime(); // Set targetDate based on selected date
    updateCountdown();

    // Update the URL with the selected exam ID
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('exam', selectedExamId); // Update the URL with the selected exam ID
    window.history.pushState({}, '', newUrl);
});

// Show the overlay when the button is clicked
document.getElementById('checkScheduleBtn').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'flex';
});

// Hide the overlay when clicking outside the iframe or pressing Escape
document.getElementById('overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('overlay').style.display = 'none';
    }
});

// Return to countdown button functionality
document.getElementById('returnToCountdownBtn').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
});

// Fetch exam dates when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchExamDates();
});