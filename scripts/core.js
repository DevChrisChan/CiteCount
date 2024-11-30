function WordCount(str) {
    str = str.trim();
    var count = 0;
    var inWord = false;

    for (var i = 0; i < str.length; i++) {
        if (/[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF]/.test(str[i]) && !/[\u3000-\u303F]/.test(str[i])) {
            count++;
            inWord = false;
        } else if (/[\u3000-\u303F]/.test(str[i])) {
            inWord = false;
        } else if (/[\u0E00-\u0E7F]/.test(str[i])) {
            if (!inWord) {
                count++;
                inWord = true;
            }
        } else if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str[i])) {
            if (!inWord) {
                count++;
                inWord = true;
            }
        } else if (/\s/.test(str[i])) {
            inWord = false;
        } else if (/[\w]/.test(str[i])) {
            if (!inWord) {
                count++;
                inWord = true;
            }
        }
    }

    return count;
}

// Load saved data when page loads
window.onload = function() {
    const savedText = localStorage.getItem('rawData');
    if (savedText) {
        document.getElementById("rawData").value = savedText;
    }
    UpdateCounts();
};

function UpdateCounts() {
    var textarea = document.getElementById("rawData");
    var rawText = textarea.value;
    var selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    var isTextSelected = selectedText.length > 0;

    rawText = rawText.replace(/ +/g, ' ');
    var citations = rawText.match(/\(.*?\)/g) || rawText.match(/（.*?）/g) || [];
    
    // Only initialize citationsData if it doesn't exist
    if (!window.citationsData) {
        const savedCitationStates = localStorage.getItem('citationStates');
        if (savedCitationStates) {
            const savedStates = JSON.parse(savedCitationStates);
            window.citationsData = citations.map(citation => ({
                text: citation,
                wordCount: WordCount(citation),
                included: savedStates[citation] !== undefined ? savedStates[citation] : true
            }));
        } else {
            window.citationsData = citations.map(citation => ({
                text: citation,
                wordCount: WordCount(citation),
                included: true
            }));
        }
    } else {
        // Update citations while preserving existing states
        const existingStates = {};
        window.citationsData.forEach(citation => {
            existingStates[citation.text] = citation.included;
        });

        window.citationsData = citations.map(citation => ({
            text: citation,
            wordCount: WordCount(citation),
            included: existingStates[citation] !== undefined ? existingStates[citation] : true
        }));
    }

    recalculateAllCounts(isTextSelected, selectedText);
}

function recalculateAllCounts(isTextSelected = false, selectedText = '') {
    var rawText = document.getElementById("rawData").value;
    var formattedText = rawText;
    var textToAnalyze = isTextSelected ? selectedText : rawText;
    var formattedTextToAnalyze = textToAnalyze;

    window.citationsData.forEach((citation, index) => {
        if (citation.included) {
            formattedTextToAnalyze = formattedTextToAnalyze.replace(citation.text, '');
        }
    });

    var wordCountNoCitations = WordCount(formattedTextToAnalyze);
    var charCountNoCitations = formattedTextToAnalyze.length;
    var wordCountWithCitations = WordCount(textToAnalyze);
    var totalCitations = isTextSelected ? 
        (textToAnalyze.match(/\(.*?\)/g) || textToAnalyze.match(/（.*?）/g) || []).length :
        window.citationsData.length;
    var includedCitationsCount = isTextSelected ? 
        (textToAnalyze.match(/\(.*?\)/g) || textToAnalyze.match(/（.*?）/g) || []).length :
        window.citationsData.filter(c => c.included).length;

    // Update citations label
    const citationsLabel = document.getElementById("citationslabel");
    if (totalCitations > 0 && includedCitationsCount < totalCitations) {
        citationsLabel.textContent = `Citations (${includedCitationsCount} of ${totalCitations} detected included)`;
    } else {
        citationsLabel.textContent = "Citations";
    }
    

    document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
    document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
    document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
    document.getElementById("charCountWithCitationsValue").innerText = textToAnalyze.length;
    document.getElementById("citationCountValue").innerText = includedCitationsCount;


    const countLabels = document.querySelectorAll('.count-label');
    countLabels.forEach(label => {
        if (isTextSelected) {
            label.textContent = label.textContent.replace(' (Selected)', '') + ' (Selected)';
        } else {
            label.textContent = label.textContent.replace(' (Selected)', '');
        }
    });

    var citationList = document.getElementById("citationList");

    if (window.citationsData.length > 0) {
        const includedCitationsWordCount = window.citationsData
            .filter(c => c.included)
            .reduce((sum, citation) => sum + citation.wordCount, 0);

        const citationTable = `
            <style>
                #selectAllBtn {
                    padding: 4px 8px;
                    margin-left: 8px;
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                #selectAllBtn:hover {
                    background-color: #e0e0e0;
                    border-color: #999;
                }
                
                #selectAllBtn:active {
                    background-color: #d0d0d0;
                    transform: translateY(1px);
                }
            </style>
            <table>
                <thead>
                    <tr>
                        <th>Citation #</th>
                        <th>In-text Citation</th>
                        <th>Word Count</th>
                        <th>
                            Include
                            <button onclick="toggleAllCitations()" id="selectAllBtn">
                                ${areAllCitationsSelected() ? 'Unselect All' : 'Select All'}
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${window.citationsData.map((citation, index) => {
                        const citationId = `citation-${index}`;
                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td style="user-select: text;">${citation.text}</td>
                                <td>${citation.wordCount}</td>
                                <td>
                                    <input data-lta-event="toggled citation inclusion" type="checkbox" 
                                           id="${citationId}" 
                                           ${citation.included ? 'checked' : ''} 
                                           onchange="updateCitationInclusion(${index})">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">Total Included Citations Word Count</td>
                        <td colspan="2" id="totalCitationWords">${includedCitationsWordCount}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Words without Citations</td>
                        <td colspan="2">${wordCountNoCitations}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Total Words</td>
                        <td colspan="2">${wordCountWithCitations}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        citationList.innerHTML = citationTable;
    } else {
        citationList.innerHTML = "There are currently no in-text citations.";
    }

    if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
        localStorage.setItem('rawData', rawText);
    }
}

function areAllCitationsSelected() {
    return window.citationsData.every(citation => citation.included);
}

function toggleAllCitations() {
    const newState = !areAllCitationsSelected();
    window.citationsData.forEach(citation => {
        citation.included = newState;
    });
    
    // Save citation states to localStorage immediately
    const citationStates = {};
    window.citationsData.forEach(citation => {
        citationStates[citation.text] = citation.included;
    });
    localStorage.setItem('citationStates', JSON.stringify(citationStates));
    
    recalculateAllCounts();
}
function updateCitationInclusion(citationIndex) {
    const checkbox = document.getElementById(`citation-${citationIndex}`);
    window.citationsData[citationIndex].included = checkbox.checked;
    
    // Save citation states to localStorage immediately
    const citationStates = {};
    window.citationsData.forEach(citation => {
        citationStates[citation.text] = citation.included;
    });
    localStorage.setItem('citationStates', JSON.stringify(citationStates));
    
    recalculateAllCounts();
}


document.getElementById("rawData").addEventListener('mouseup', function() {
    UpdateCounts();
});

document.getElementById("rawData").addEventListener('keyup', function() {
    UpdateCounts();
});


/*const editor = document.getElementById('rawData');
        const overlay = document.getElementById('highlight-overlay');

        function updateHighlights() {
            var textarea = document.getElementById("rawData");
    var text = textarea.value;
            let htmlContent = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');

            // Highlight complete parentheses pairs
            htmlContent = htmlContent.replace(/\([^)]+\)/g, match => 
                `<mark>${match}</mark>`
            );

            overlay.innerHTML = htmlContent;
            overlay.scrollTop = editor.scrollTop;
            
            // Update word counts and citations
            UpdateCounts();
        }

        editor.addEventListener('input', updateHighlights);
        editor.addEventListener('scroll', () => {
            overlay.scrollTop = editor.scrollTop;
        });

        // Insert all the functions from the provided code here
        [YOUR_PREVIOUS_CODE_HERE]

        // Initialize
        updateHighlights();*/