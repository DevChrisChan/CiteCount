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

function UpdateCounts() {
    var textarea = document.getElementById("rawData");
    var rawText = textarea.value;
    var selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    var isTextSelected = selectedText.length > 0;

    rawText = rawText.replace(/ +/g, ' ');
    var citations = rawText.match(/\(.*?\)/g) || rawText.match(/（.*?）/g) || [];
    
    // Store original citation information for later use
    window.citationsData = citations.map(citation => ({
        text: citation,
        wordCount: WordCount(citation),
        included: true
    }));

    recalculateAllCounts(isTextSelected, selectedText);
}

function recalculateAllCounts(isTextSelected = false, selectedText = '') {
    var rawText = document.getElementById("rawData").value;
    var formattedText = rawText;
    var textToAnalyze = isTextSelected ? selectedText : rawText;
    var formattedTextToAnalyze = textToAnalyze;

    // Only remove citations that are still included
    window.citationsData.forEach((citation, index) => {
        if (citation.included) {
            formattedTextToAnalyze = formattedTextToAnalyze.replace(citation.text, '');
        }
    });

    var wordCountNoCitations = WordCount(formattedTextToAnalyze);
    var charCountNoCitations = formattedTextToAnalyze.length;
    var wordCountWithCitations = WordCount(textToAnalyze);
    var includedCitationsCount = isTextSelected ? 
        (textToAnalyze.match(/\(.*?\)/g) || textToAnalyze.match(/（.*?）/g) || []).length :
        window.citationsData.filter(c => c.included).length;

    // Update display elements with count information
    document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
    document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
    document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
    document.getElementById("charCountWithCitationsValue").innerText = textToAnalyze.length;
    document.getElementById("citationCountValue").innerText = includedCitationsCount;

    // Add selection indicator if text is selected
    const countLabels = document.querySelectorAll('.count-label');
    countLabels.forEach(label => {
        if (isTextSelected) {
            label.textContent = label.textContent.replace(' (Selected)', '') + ' (Selected)';
        } else {
            label.textContent = label.textContent.replace(' (Selected)', '');
        }
    });

    // Generate Citation List
    var citationList = document.getElementById("citationList");

    if (window.citationsData.length > 0) {
        const includedCitationsWordCount = window.citationsData
            .filter(c => c.included)
            .reduce((sum, citation) => sum + citation.wordCount, 0);

        const citationTable = `
            <table>
                <thead>
                    <tr>
                        <th>Citation #</th>
                        <th>In-text Citation</th>
                        <th>Word Count</th>
                        <th>Include</th>
                    </tr>
                </thead>
                <tbody>
                    ${window.citationsData.map((citation, index) => {
                        const citationId = `citation-${index}`;
                        return `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${citation.text}</td>
                                <td>${citation.wordCount}</td>
                                <td>
                                    <input type="checkbox" 
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

    // Save to local storage if enabled
    if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
        localStorage.setItem('rawData', rawText);
    }
}

function updateCitationInclusion(citationIndex) {
    const checkbox = document.getElementById(`citation-${citationIndex}`);
    window.citationsData[citationIndex].included = checkbox.checked;
    recalculateAllCounts();
}

document.getElementById("rawData").addEventListener('mouseup', function() {
    UpdateCounts();
});

document.getElementById("rawData").addEventListener('keyup', function() {
    UpdateCounts();
});