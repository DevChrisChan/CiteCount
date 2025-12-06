const gradeBoundaries = {
    'M24': {
        // Subject boundaries - [grade 7, 6, 5, 4, 3, 2, 1]
        'biology-HL': [81, 71, 61, 50, 38, 27, 0],
        'biology-SL': [79, 68, 56, 43, 30, 17, 0],
        'chemistry-HL': [81, 71, 61, 50, 38, 27, 0],
        'chemistry-SL': [79, 68, 56, 43, 30, 17, 0],
        'physics-HL': [81, 71, 61, 50, 38, 27, 0],
        'physics-SL': [79, 68, 56, 43, 30, 17, 0],
        'ess-SL': [79, 68, 56, 43, 30, 17, 0],
        'math-aa-HL': [82, 72, 62, 50, 38, 26, 0],
        'math-aa-SL': [80, 69, 58, 46, 33, 21, 0],
        'math-ai-HL': [82, 72, 62, 50, 38, 26, 0],
        'math-ai-SL': [80, 69, 58, 46, 33, 21, 0],
        'economics-HL': [79, 69, 59, 48, 36, 24, 0],
        'economics-SL': [78, 67, 56, 44, 31, 19, 0],
        'business-HL': [79, 69, 59, 48, 36, 24, 0],
        'business-SL': [78, 67, 56, 44, 31, 19, 0],
        'psychology-HL': [79, 69, 59, 48, 36, 24, 0],
        'psychology-SL': [78, 67, 56, 44, 31, 19, 0],
        'history-HL': [79, 69, 59, 48, 36, 24, 0],
        'history-SL': [78, 67, 56, 44, 31, 19, 0],
        'geography-HL': [79, 69, 59, 48, 36, 24, 0],
        'geography-SL': [78, 67, 56, 44, 31, 19, 0],
        'english-a-HL': [79, 69, 59, 48, 36, 24, 0],
        'english-a-SL': [78, 67, 56, 44, 31, 19, 0],
        'english-lit-HL': [79, 69, 59, 48, 36, 24, 0],
        'english-lit-SL': [78, 67, 56, 44, 31, 19, 0],
        'spanish-a-HL': [79, 69, 59, 48, 36, 24, 0],
        'spanish-a-SL': [78, 67, 56, 44, 31, 19, 0],
        'french-a-HL': [79, 69, 59, 48, 36, 24, 0],
        'french-a-SL': [78, 67, 56, 44, 31, 19, 0],
        'spanish-b-HL': [81, 71, 60, 48, 35, 23, 0],
        'spanish-b-SL': [80, 69, 57, 44, 31, 18, 0],
        'french-b-HL': [81, 71, 60, 48, 35, 23, 0],
        'french-b-SL': [80, 69, 57, 44, 31, 18, 0],
        'german-b-HL': [81, 71, 60, 48, 35, 23, 0],
        'german-b-SL': [80, 69, 57, 44, 31, 18, 0],
        'mandarin-b-HL': [81, 71, 60, 48, 35, 23, 0],
        'mandarin-b-SL': [80, 69, 57, 44, 31, 18, 0],
        'visual-arts-HL': [80, 70, 60, 49, 37, 25, 0],
        'visual-arts-SL': [79, 68, 57, 45, 32, 20, 0],
        'music-HL': [80, 70, 60, 49, 37, 25, 0],
        'music-SL': [79, 68, 57, 45, 32, 20, 0],
        'theatre-HL': [80, 70, 60, 49, 37, 25, 0],
        'theatre-SL': [79, 68, 57, 45, 32, 20, 0],
        // TOK boundaries [A, B, C, D, E]
        'tok': [23, 18, 12, 6, 0],
        // EE boundaries [A, B, C, D, E]
        'ee': [28, 22, 16, 10, 0]
    }
};

// Assessment structures for different subjects
const assessmentStructures = {
    'biology': {
        'HL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 72, weight: 0.36 },
            { name: 'Paper 3', max: 45, weight: 0.24 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 50, weight: 0.40 },
            { name: 'Paper 3', max: 35, weight: 0.20 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ]
    },
    'chemistry': {
        'HL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 90, weight: 0.36 },
            { name: 'Paper 3', max: 45, weight: 0.24 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 50, weight: 0.40 },
            { name: 'Paper 3', max: 35, weight: 0.20 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ]
    },
    'physics': {
        'HL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 95, weight: 0.36 },
            { name: 'Paper 3', max: 45, weight: 0.24 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.20 },
            { name: 'Paper 2', max: 50, weight: 0.40 },
            { name: 'Paper 3', max: 35, weight: 0.20 },
            { name: 'Internal Assessment', max: 24, weight: 0.20 }
        ]
    },
    'ess': {
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.25 },
            { name: 'Paper 2', max: 50, weight: 0.50 },
            { name: 'Internal Assessment', max: 30, weight: 0.25 }
        ]
    },
    'math-aa': {
        'HL': [
            { name: 'Paper 1', max: 110, weight: 0.30 },
            { name: 'Paper 2', max: 110, weight: 0.30 },
            { name: 'Paper 3', max: 55, weight: 0.20 },
            { name: 'Internal Assessment', max: 20, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 80, weight: 0.40 },
            { name: 'Paper 2', max: 80, weight: 0.40 },
            { name: 'Internal Assessment', max: 20, weight: 0.20 }
        ]
    },
    'math-ai': {
        'HL': [
            { name: 'Paper 1', max: 110, weight: 0.30 },
            { name: 'Paper 2', max: 110, weight: 0.30 },
            { name: 'Paper 3', max: 55, weight: 0.20 },
            { name: 'Internal Assessment', max: 20, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 80, weight: 0.40 },
            { name: 'Paper 2', max: 80, weight: 0.40 },
            { name: 'Internal Assessment', max: 20, weight: 0.20 }
        ]
    },
    // Generic assessment structure for humanities and languages
    'generic-humanities': {
        'HL': [
            { name: 'Paper 1', max: 40, weight: 0.35 },
            { name: 'Paper 2', max: 40, weight: 0.25 },
            { name: 'Paper 3', max: 25, weight: 0.20 },
            { name: 'Internal Assessment', max: 25, weight: 0.20 }
        ],
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.35 },
            { name: 'Paper 2', max: 40, weight: 0.45 },
            { name: 'Internal Assessment', max: 25, weight: 0.20 }
        ]
    },
    'generic-language': {
        'HL': [
            { name: 'Paper 1', max: 40, weight: 0.25 },
            { name: 'Paper 2', max: 60, weight: 0.25 },
            { name: 'Written Assignment', max: 30, weight: 0.25 },
            { name: 'Individual Oral', max: 30, weight: 0.25 }
        ],
        'SL': [
            { name: 'Paper 1', max: 40, weight: 0.30 },
            { name: 'Paper 2', max: 60, weight: 0.30 },
            { name: 'Individual Oral', max: 30, weight: 0.40 }
        ]
    },
    'generic-arts': {
        'HL': [
            { name: 'Comparative Study', max: 30, weight: 0.20 },
            { name: 'Process Portfolio', max: 60, weight: 0.40 },
            { name: 'Exhibition', max: 60, weight: 0.40 }
        ],
        'SL': [
            { name: 'Comparative Study', max: 30, weight: 0.20 },
            { name: 'Process Portfolio', max: 60, weight: 0.40 },
            { name: 'Exhibition', max: 60, weight: 0.40 }
        ]
    }
};

// Map subjects to assessment structures
const subjectAssessmentMap = {
    'biology': 'biology',
    'chemistry': 'chemistry',
    'physics': 'physics',
    'ess': 'ess',
    'math-aa': 'math-aa',
    'math-ai': 'math-ai',
    'economics': 'generic-humanities',
    'business': 'generic-humanities',
    'psychology': 'generic-humanities',
    'history': 'generic-humanities',
    'geography': 'generic-humanities',
    'english-a': 'generic-language',
    'english-lit': 'generic-language',
    'spanish-a': 'generic-language',
    'french-a': 'generic-language',
    'spanish-b': 'generic-language',
    'french-b': 'generic-language',
    'german-b': 'generic-language',
    'mandarin-b': 'generic-language',
    'visual-arts': 'generic-arts',
    'music': 'generic-arts',
    'theatre': 'generic-arts'
};

// Store for calculator state
let calculatorState = {
    selectedBoundary: 'M24',
    groups: {
        1: { subject: '', level: '', marks: [] },
        2: { subject: '', level: '', marks: [] },
        3: { subject: '', level: '', marks: [] },
        4: { subject: '', level: '', marks: [] },
        5: { subject: '', level: '', marks: [] },
        6: { subject: '', level: '', marks: [] }
    },
    tok: { essay: 10, exhibition: 5 },
    ee: { mark: 17 }
};

// Initialize calculator
document.addEventListener('DOMContentLoaded', () => {
    initializeBoundarySelector();
    initializeGroups();
    initializeTOK();
    initializeEE();
    updateResults();
});

// Boundary selector
function initializeBoundarySelector() {
    const options = document.querySelectorAll('.boundary-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            calculatorState.selectedBoundary = option.dataset.boundary;
            updateResults();
        });
    });
}

// Group toggle
function toggleGroup(button) {
    button.classList.toggle('collapsed');
    const content = button.closest('.group-header').nextElementSibling;
    if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize subject groups
function initializeGroups() {
    for (let i = 1; i <= 6; i++) {
        const subjectSelect = document.getElementById(`group${i}-subject`);
        const levelSelect = document.getElementById(`group${i}-level`);
        
        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => handleSubjectChange(i));
        }
        
        if (levelSelect) {
            levelSelect.addEventListener('change', () => handleLevelChange(i));
        }
    }
}

// Handle subject selection
function handleSubjectChange(groupNum) {
    const subjectSelect = document.getElementById(`group${groupNum}-subject`);
    const subject = subjectSelect.value;
    
    calculatorState.groups[groupNum].subject = subject;
    calculatorState.groups[groupNum].marks = [];
    
    if (subject) {
        checkAndRenderAssessments(groupNum);
    } else {
        document.getElementById(`group${groupNum}-assessments`).style.display = 'none';
        document.getElementById(`group${groupNum}-results`).style.display = 'none';
    }
    
    updateResults();
}

// Handle level selection
function handleLevelChange(groupNum) {
    const levelSelect = document.getElementById(`group${groupNum}-level`);
    const level = levelSelect.value;
    
    calculatorState.groups[groupNum].level = level;
    calculatorState.groups[groupNum].marks = [];
    
    checkAndRenderAssessments(groupNum);
    updateResults();
}

// Check if ready to render assessments
function checkAndRenderAssessments(groupNum) {
    const group = calculatorState.groups[groupNum];
    
    if (group.subject && group.level) {
        renderAssessments(groupNum);
    }
}

// Render assessment inputs
function renderAssessments(groupNum) {
    const group = calculatorState.groups[groupNum];
    const assessmentsContainer = document.getElementById(`group${groupNum}-assessments`);
    const resultsContainer = document.getElementById(`group${groupNum}-results`);
    
    const assessmentKey = subjectAssessmentMap[group.subject];
    const assessments = assessmentStructures[assessmentKey]?.[group.level];
    
    if (!assessments) return;
    
    assessmentsContainer.innerHTML = '';
    assessmentsContainer.style.display = 'flex';
    resultsContainer.style.display = 'flex';
    
    assessments.forEach((assessment, index) => {
        const assessmentItem = document.createElement('div');
        assessmentItem.className = 'assessment-item';
        
        const defaultValue = Math.floor(assessment.max / 2);
        if (!group.marks[index]) {
            group.marks[index] = defaultValue;
        }
        
        assessmentItem.innerHTML = `
            <div class="assessment-header">
                <span class="assessment-name">${assessment.name}</span>
                <span>Weight: ${Math.round(assessment.weight * 100)}%</span>
            </div>
            <div class="slider-container">
                <input type="range" min="0" max="${assessment.max}" value="${group.marks[index] || defaultValue}" 
                       data-group="${groupNum}" data-index="${index}" class="assessment-slider">
                <input type="number" min="0" max="${assessment.max}" value="${group.marks[index] || defaultValue}"
                       data-group="${groupNum}" data-index="${index}" class="assessment-number">
                <span>/ ${assessment.max}</span>
            </div>
        `;
        
        assessmentsContainer.appendChild(assessmentItem);
        
        const slider = assessmentItem.querySelector('.assessment-slider');
        const number = assessmentItem.querySelector('.assessment-number');
        
        slider.addEventListener('input', (e) => handleAssessmentChange(e, number));
        number.addEventListener('input', (e) => handleAssessmentChange(e, slider));
    });
    
    calculateGroupGrade(groupNum);
}

// Handle assessment mark change
function handleAssessmentChange(e, linkedInput) {
    const groupNum = parseInt(e.target.dataset.group);
    const index = parseInt(e.target.dataset.index);
    const value = parseInt(e.target.value);
    
    calculatorState.groups[groupNum].marks[index] = value;
    linkedInput.value = value;
    
    calculateGroupGrade(groupNum);
    updateResults();
}

// Calculate grade for a subject group
function calculateGroupGrade(groupNum) {
    const group = calculatorState.groups[groupNum];
    
    if (!group.subject || !group.level) return;
    
    const assessmentKey = subjectAssessmentMap[group.subject];
    const assessments = assessmentStructures[assessmentKey]?.[group.level];
    
    if (!assessments) return;
    
    // Calculate weighted percentage
    let totalMark = 0;
    assessments.forEach((assessment, index) => {
        const mark = group.marks[index] || 0;
        const percentage = (mark / assessment.max) * 100;
        totalMark += percentage * assessment.weight;
    });
    
    totalMark = Math.round(totalMark);
    
    // Get grade from boundaries
    const boundaryKey = `${group.subject}-${group.level}`;
    const boundaries = gradeBoundaries[calculatorState.selectedBoundary][boundaryKey];
    
    let grade = 1;
    if (boundaries) {
        for (let i = 0; i < boundaries.length; i++) {
            if (totalMark >= boundaries[i]) {
                grade = 7 - i;
                break;
            }
        }
    }
    
    // Update display
    const gradeCircle = document.getElementById(`group${groupNum}-grade`);
    const markDisplay = document.getElementById(`group${groupNum}-mark`);
    
    gradeCircle.textContent = grade;
    gradeCircle.className = `grade-circle grade-${grade}`;
    markDisplay.textContent = totalMark;
    
    group.calculatedGrade = grade;
    group.calculatedMark = totalMark;
}

// Initialize TOK
function initializeTOK() {
    const essaySlider = document.getElementById('tok-essay');
    const essayNumber = document.getElementById('tok-essay-num');
    const exhibitionSlider = document.getElementById('tok-exhibition');
    const exhibitionNumber = document.getElementById('tok-exhibition-num');
    
    const syncInputs = (slider, number, key) => {
        slider.addEventListener('input', (e) => {
            number.value = e.target.value;
            calculatorState.tok[key] = parseInt(e.target.value);
            calculateTOKGrade();
            updateResults();
        });
        
        number.addEventListener('input', (e) => {
            slider.value = e.target.value;
            calculatorState.tok[key] = parseInt(e.target.value);
            calculateTOKGrade();
            updateResults();
        });
    };
    
    syncInputs(essaySlider, essayNumber, 'essay');
    syncInputs(exhibitionSlider, exhibitionNumber, 'exhibition');
    
    calculateTOKGrade();
}

// Calculate TOK grade
function calculateTOKGrade() {
    const totalMark = (calculatorState.tok.essay * 2) + calculatorState.tok.exhibition;
    const boundaries = gradeBoundaries[calculatorState.selectedBoundary]['tok'];
    
    const grades = ['E', 'D', 'C', 'B', 'A'];
    let grade = 'E';
    
    for (let i = 0; i < boundaries.length; i++) {
        if (totalMark >= boundaries[i]) {
            grade = grades[4 - i];
            break;
        }
    }
    
    document.getElementById('tok-grade').textContent = grade;
    document.getElementById('tok-mark').textContent = totalMark;
    
    calculatorState.tok.grade = grade;
    calculatorState.tok.totalMark = totalMark;
}

// Initialize EE
function initializeEE() {
    const eeSlider = document.getElementById('ee-mark');
    const eeNumber = document.getElementById('ee-mark-num');
    
    eeSlider.addEventListener('input', (e) => {
        eeNumber.value = e.target.value;
        calculatorState.ee.mark = parseInt(e.target.value);
        calculateEEGrade();
        updateResults();
    });
    
    eeNumber.addEventListener('input', (e) => {
        eeSlider.value = e.target.value;
        calculatorState.ee.mark = parseInt(e.target.value);
        calculateEEGrade();
        updateResults();
    });
    
    calculateEEGrade();
}

// Calculate EE grade
function calculateEEGrade() {
    const mark = calculatorState.ee.mark;
    const boundaries = gradeBoundaries[calculatorState.selectedBoundary]['ee'];
    
    const grades = ['E', 'D', 'C', 'B', 'A'];
    let grade = 'E';
    
    for (let i = 0; i < boundaries.length; i++) {
        if (mark >= boundaries[i]) {
            grade = grades[4 - i];
            break;
        }
    }
    
    document.getElementById('ee-grade').textContent = grade;
    document.getElementById('ee-mark').textContent = mark;
    
    calculatorState.ee.grade = grade;
}

// Calculate core points (TOK + EE matrix)
function calculateCorePoints() {
    const tokGrade = calculatorState.tok.grade || 'E';
    const eeGrade = calculatorState.ee.grade || 'E';
    
    const coreMatrix = {
        'A': { 'A': 3, 'B': 3, 'C': 2, 'D': 2, 'E': 1 },
        'B': { 'A': 3, 'B': 2, 'C': 2, 'D': 1, 'E': 0 },
        'C': { 'A': 2, 'B': 2, 'C': 1, 'D': 1, 'E': 0 },
        'D': { 'A': 2, 'B': 1, 'C': 1, 'D': 0, 'E': 0 },
        'E': { 'A': 1, 'B': 0, 'C': 0, 'D': 0, 'E': 0 }
    };
    
    return coreMatrix[tokGrade]?.[eeGrade] || 0;
}

// Update results panel
function updateResults() {
    let totalPoints = 0;
    let completedSubjects = 0;
    let hlCount = 0;
    let slCount = 0;
    let hlSum = 0;
    let slSum = 0;
    let gradeCounts = [0, 0, 0, 0, 0, 0, 0, 0]; // Index 0 unused, 1-7 for grades
    
    // Update group results
    for (let i = 1; i <= 6; i++) {
        const group = calculatorState.groups[i];
        const resultCell = document.getElementById(`result-group${i}`);
        
        if (group.calculatedGrade) {
            resultCell.textContent = group.calculatedGrade;
            totalPoints += group.calculatedGrade;
            completedSubjects++;
            
            gradeCounts[group.calculatedGrade]++;
            
            if (group.level === 'HL') {
                hlCount++;
                hlSum += group.calculatedGrade;
            } else if (group.level === 'SL') {
                slCount++;
                slSum += group.calculatedGrade;
            }
        } else {
            resultCell.textContent = '-';
        }
    }
    
    // Core points
    const corePoints = calculateCorePoints();
    totalPoints += corePoints;
    
    document.getElementById('result-tok').textContent = calculatorState.tok.grade || '-';
    document.getElementById('result-ee').textContent = calculatorState.ee.grade || '-';
    document.getElementById('result-core').textContent = corePoints;
    document.getElementById('total-points').textContent = totalPoints;
    
    // Check diploma requirements
    checkDiplomaRequirements(completedSubjects, totalPoints, gradeCounts, hlCount, hlSum, slCount, slSum);
}

// Check diploma requirements
function checkDiplomaRequirements(completedSubjects, totalPoints, gradeCounts, hlCount, hlSum, slCount, slSum) {
    const statusElement = document.getElementById('diploma-status');
    const messageElement = document.getElementById('diploma-message');
    
    let awarded = true;
    let message = 'All requirements met';
    
    if (completedSubjects < 6) {
        awarded = false;
        message = 'Complete all 6 subjects';
    } else if (totalPoints < 24) {
        awarded = false;
        message = 'Minimum 24 points required';
    } else if (hlCount !== 3 && hlCount !== 4) {
        awarded = false;
        message = '3 or 4 HL subjects required';
    } else if (hlCount >= 3 && hlSum < 12) {
        awarded = false;
        message = 'Minimum 12 HL points required';
    } else if (slCount === 3 && slSum < 9) {
        awarded = false;
        message = 'Minimum 9 SL points required';
    } else if (gradeCounts[1] > 0) {
        awarded = false;
        message = 'No grade 1s allowed';
    } else if (gradeCounts[2] > 2) {
        awarded = false;
        message = 'Maximum two grade 2s allowed';
    } else if (gradeCounts[3] > 3) {
        awarded = false;
        message = 'Maximum three grade 3s allowed';
    } else if (calculatorState.tok.grade === 'E' || calculatorState.ee.grade === 'E') {
        awarded = false;
        message = 'Grade E in TOK or EE not allowed';
    }
    
    if (awarded) {
        statusElement.className = 'diploma-status diploma-yes';
        statusElement.innerHTML = `<div>DIPLOMA AWARDED</div><div style="font-size: 0.875rem; margin-top: 0.5rem;">${message}</div>`;
    } else {
        statusElement.className = 'diploma-status diploma-no';
        statusElement.innerHTML = `<div>DIPLOMA NOT AWARDED</div><div style="font-size: 0.875rem; margin-top: 0.5rem;">${message}</div>`;
    }
}

// Reset calculator
function resetCalculator() {
    calculatorState = {
        selectedBoundary: 'M24',
        groups: {
            1: { subject: '', level: '', marks: [] },
            2: { subject: '', level: '', marks: [] },
            3: { subject: '', level: '', marks: [] },
            4: { subject: '', level: '', marks: [] },
            5: { subject: '', level: '', marks: [] },
            6: { subject: '', level: '', marks: [] }
        },
        tok: { essay: 10, exhibition: 5 },
        ee: { mark: 17 }
    };
    
    // Reset subject selects
    for (let i = 1; i <= 6; i++) {
        const subjectSelect = document.getElementById(`group${i}-subject`);
        const levelSelect = document.getElementById(`group${i}-level`);
        
        if (subjectSelect) subjectSelect.value = '';
        if (levelSelect) levelSelect.value = '';
        
        document.getElementById(`group${i}-assessments`).style.display = 'none';
        document.getElementById(`group${i}-results`).style.display = 'none';
    }
    
    // Reset TOK
    document.getElementById('tok-essay').value = 10;
    document.getElementById('tok-essay-num').value = 10;
    document.getElementById('tok-exhibition').value = 5;
    document.getElementById('tok-exhibition-num').value = 5;
    
    // Reset EE
    document.getElementById('ee-mark').value = 17;
    document.getElementById('ee-mark-num').value = 17;
    
    calculateTOKGrade();
    calculateEEGrade();
    updateResults();
}
