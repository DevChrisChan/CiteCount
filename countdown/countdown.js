let targetDate = new Date('2025-04-25').getTime();
        let interval;

        // Fetch the exam dates
        async function fetchExamDates() {
            try {
                const response = await fetch('/countdown/dates.json');
                const examDates = await response.json();

                const select = document.getElementById('examSelect');
                examDates.forEach(exam => {
                    const option = document.createElement('option');
                    option.value = exam.date;
                    const dateObj = new Date(exam.date);
                    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                    option.textContent = `${exam.name} - ${formattedDate}`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading exam dates:', error);
            }
        }

        function updateCountdown() {
            if (!targetDate) return;

            function update() {
                const now = new Date().getTime();
                const difference = targetDate - now;

                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                document.getElementById('days').textContent = days.toString().padStart(3, '0');
                document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
                document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
                document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');

                if (difference < 0) {
                    clearInterval(interval);
                    document.querySelector('.countdown').innerHTML = '<h2>The IB Exams have started!</h2>';
                }
            }

            if (interval) {
                clearInterval(interval);
            }

            update();
            interval = setInterval(update, 1000);
        }

        document.getElementById('examSelect').addEventListener('change', function(e) {
            if (e.target.value) {
                targetDate = new Date(e.target.value).getTime();
                updateCountdown();
            }
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

        // Start countdown with default date
        updateCountdown();

        // Load exam dates when page loads
        fetchExamDates();