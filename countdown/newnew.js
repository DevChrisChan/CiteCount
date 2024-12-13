let examData = [];
let currentExam = null;

function updateCountdown() {
    if (!currentExam) return;

    const now = new Date().getTime();
    const examDate = new Date(currentExam.date).getTime();
    const distance = examDate - now;

    const months = Math.floor(distance / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((distance % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('months').textContent = months;
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
}

function updateExamDisplay(exam) {
    currentExam = exam;
    document.getElementById('examTitle').textContent = exam.name;
    updateCountdown();
    
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('id', exam.id);
    history.pushState({}, '', newUrl);
}

function initializeSelect2() {
$('#examSelect').select2({
placeholder: 'Select an exam...', // Placeholder for the selected item
allowClear: true,
data: examData.map(exam => ({
    id: exam.id,
    text: exam.name
}))
});

// Set the placeholder for the search input when the dropdown is opened
$('#examSelect').on('select2:open', function() {
const searchInput = $('.select2-search__field');
searchInput.attr('placeholder', 'Search for an exam...');
});
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch exam data from external JSON file
        const response = await fetch('/countdown/dates.json');
        examData = await response.json();

        initializeSelect2();

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('id');
        const initialExam = examId ? 
            examData.find(exam => exam.id === examId) : 
            examData[0];

        $('#examSelect').val(initialExam.id).trigger('change');
        updateExamDisplay(initialExam);

        // Set up exam selection change handler
        $('#examSelect').on('select2:select', function(e) {
            const selectedExam = examData.find(exam => exam.id === e.params.data.id);
            updateExamDisplay(selectedExam);
        });

        // Start countdown
        setInterval(updateCountdown, 1000);
    } catch (error) {
        console.error('Error loading exam data:', error);
    }
});