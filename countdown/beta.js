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

function updateCountdown() {
    if (!currentExam) {
        const defaultCountdown = {
            date: DEFAULT_DATE,
            name: ''
        };
        currentExam = defaultCountdown;
    }

    const now = new Date().getTime();
    const examDate = new Date(currentExam.date).getTime();
    const distance = examDate - now;

    const totalDays = Math.floor(distance / (1000 * 60 * 60 * 24));

    const startDate = new Date(now);
    const endDate = new Date(currentExam.date);
    const months = endDate.getMonth() - startDate.getMonth() + 
                   (12 * (endDate.getFullYear() - startDate.getFullYear()));
    
    const adjustedStartDate = new Date(startDate.getFullYear(), startDate.getMonth() + months, 1);
    const remainingDays = Math.floor((endDate - adjustedStartDate) / (1000 * 60 * 60 * 24));

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('months').textContent = months;
    document.getElementById('days').textContent = padZero(remainingDays);
    document.getElementById('hours').textContent = padZero(hours);
    document.getElementById('minutes').textContent = padZero(minutes);
    document.getElementById('seconds').textContent = padZero(seconds);
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
        document.title = "IB Exam Countdowns - CiteCount";
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
        const response = await fetch('/countdown/dates.json');
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