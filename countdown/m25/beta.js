let examData = [];
let currentExam = null;
const DEFAULT_DATE = '2025-04-25';

function padZero(num) {
    return num < 10 ? '0' + num : num;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate(); 
    const month = date.getMonth() + 1; 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function calculateTotalDays(targetDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const examDate = new Date(targetDate);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(examDate - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function updateDaysCountdown() {
    if (!currentExam) return;

    const now = new Date();
    const examDate = new Date(currentExam.date);
    const distance = examDate - now;

    const totalDays = calculateTotalDays(currentExam.date);
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (distance < 0) {
        document.getElementById('dmonths').textContent = '00';
        document.getElementById('dhours').textContent = '00';
        document.getElementById('dminutes').textContent = '00';
        document.getElementById('dseconds').textContent = '00';
    } else {
        document.getElementById('dmonths').textContent = padZero(totalDays);
        document.getElementById('dhours').textContent = padZero(hours);
        document.getElementById('dminutes').textContent = padZero(minutes);
        document.getElementById('dseconds').textContent = padZero(seconds);
    }
}

function updateCountdown() {
    if (!currentExam) {
        const defaultCountdown = {
            date: DEFAULT_DATE,
            name: ''
        };
        currentExam = defaultCountdown;
    }

    const now = new Date();
    const examDate = new Date(currentExam.date);
    const distance = examDate - now;

    let months = (examDate.getFullYear() - now.getFullYear()) * 12;
    months += examDate.getMonth() - now.getMonth();
    
    if (examDate.getDate() < now.getDate()) {
        months--;
    }

    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + months + 1, 0);
    let remainingDays;
    
    if (examDate.getDate() >= now.getDate()) {
        remainingDays = examDate.getDate() - now.getDate();
    } else {
        remainingDays = examDate.getDate() + (lastDayOfMonth.getDate() - now.getDate());
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (distance < 0) {
        document.getElementById('months').textContent = '00';
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
    } else {
        document.getElementById('months').textContent = months < 0 ? '00' : padZero(months);
        document.getElementById('days').textContent = padZero(remainingDays);
        document.getElementById('hours').textContent = padZero(hours);
        document.getElementById('minutes').textContent = padZero(minutes);
        document.getElementById('seconds').textContent = padZero(seconds);
    }
    
    updateDaysCountdown();
}

function updateExamDisplay(exam, displayTitle) {
    currentExam = exam;

    if (exam) {
        const formattedDate = formatDate(exam.date);
        const displayText = `${exam.name} [${formattedDate}]`;
        document.getElementById('examTitle').textContent = displayTitle || displayText;
        document.title = `${displayText} Countdown - CiteCount`;
    } else {
        const defaultDate = formatDate(DEFAULT_DATE);
        document.getElementById('examTitle').textContent = `Select or search for an exam below.`;
    }

    updateCountdown();

    if (exam && exam.id) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', exam.id);
        history.pushState({}, '', newUrl);
    }
}

function initializeSelect2() {
    $('#examSelect').select2({
        placeholder: 'Select an exam...',
        allowClear: true,
        data: examData.map(exam => ({
            id: exam.id,
            text: `${exam.name} [${formatDate(exam.date)}]`
        }))
    });

    $('#examSelect').on('select2:open', function() {
        const searchInput = $('.select2-search__field');
        searchInput.attr('placeholder', 'Search for an exam...');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/countdown/m25/dates.json');
        examData = await response.json();

        initializeSelect2();

        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('id');
        const defaultExam = examData[0];

        if (!examId) {
            $('#examSelect').val(null).trigger('change');
            updateExamDisplay(null);
            history.pushState({}, '', window.location.pathname);
        } else {
            const selectedExam = examData.find(exam => exam.id === examId);
            if (selectedExam) {
                $('#examSelect').val(examId).trigger('change');
                updateExamDisplay(selectedExam);
            } else {
                $('#examSelect').val(null).trigger('change');
                updateExamDisplay(null);
                history.pushState({}, '', window.location.pathname);
            }
        }

        $('#examSelect').on('select2:select', function(e) {
            const selectedExam = examData.find(exam => exam.id === e.params.data.id);
            updateExamDisplay(selectedExam);
        });

        const countdownElement = document.querySelector('.countdown:not(.days .countdown)');
        const daysElement = document.querySelector('.days');

        countdownElement.addEventListener('click', function() {
            countdownElement.classList.add('hidden');
            daysElement.classList.add('visible');
        });

        daysElement.addEventListener('click', function() {
            daysElement.classList.remove('visible');
            countdownElement.classList.remove('hidden');
        });

        setInterval(updateCountdown, 1000);
    } catch (error) {
        console.error('Error loading exam data:', error);
    }
});

function copyUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const button = document.getElementById('shareButton');
        button.textContent = 'Copied URL!';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = 'Share Countdown';
            button.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}