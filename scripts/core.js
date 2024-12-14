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
    if (rawText == "!dev") {
        localStorage.setItem('dev', 'enabled');
        notify('Restart for effects to take.')
    }
    if (rawText == "!stop") {
        disableDev();
    }
    if (localStorage.getItem('dev') === "enabled") {
        const rawText = "!stats"; // Simulating the command

        if (rawText === "!stats") {
            const browserInfo = {
                browserName: navigator.appName,
                browserVersion: navigator.userAgent,
                platform: navigator.platform,
            };
            const memoryInfo = window.performance.memory;

            function buildTable() {
                const tableContainer = document.getElementById('tableContainer');
                tableContainer.innerHTML = ''; // Clear previous table if any

                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');

                const headerRow = document.createElement('tr');
                const headerKey = document.createElement('th');
                const headerValue = document.createElement('th');

                headerKey.textContent = 'Key';
                headerValue.textContent = 'Value';

                headerRow.appendChild(headerKey);
                headerRow.appendChild(headerValue);
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Populate the table with localStorage data
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);

                    const row = document.createElement('tr');
                    const cellKey = document.createElement('td');
                    const cellValue = document.createElement('td');

                    cellKey.textContent = key;
                    cellValue.textContent = value;

                    row.appendChild(cellKey);
                    row.appendChild(cellValue);
                    tbody.appendChild(row);
                }

                table.appendChild(tbody);
                tableContainer.appendChild(table);
            }

            function logMemoryUsage() {
                const totalHeapSize = memoryInfo.totalJSHeapSize / (1024 ** 2); // Convert to MB
                const usedHeapSize = memoryInfo.usedJSHeapSize / (1024 ** 2);   // Convert to MB
                const heapSizeLimit = memoryInfo.jsHeapSizeLimit / (1024 ** 2); // Convert to MB
                const usagePercentage = ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2); // Percentage

                buildTable(); // Rebuild the table to show updated localStorage content

                const debugSpan = document.getElementById('debug');
                debugSpan.textContent = `Total: ${totalHeapSize.toFixed(2)} MB, Used: ${usedHeapSize.toFixed(2)} MB, Limit: ${heapSizeLimit.toFixed(2)} MB, Usage: ${usagePercentage}%`;
            }

            setInterval(logMemoryUsage, 1000);
        }
    }
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
        if (wordCountWithCitations === 0) {
            citationList.innerHTML = "Start typing, paste your document, or drag and drop your Word / PDF document directly into CiteCount. Detected in-text citations will appear here.";
        } else {
            citationList.innerHTML = "There are currently no in-text citations.";   
        }
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

document.getElementById('rawData').addEventListener('input', function() {
    document.getElementById('safety').style.display = 'none';
});