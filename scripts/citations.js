
var citationsCounter = document.getElementById("Citations");

citationsCounter.onclick = function() {
	citationsModal.classList.add("show");
}

var citationsModal = document.getElementById("citationsModal");
var citationsBtn = document.querySelector(".citations-link");
var citationsSpan = document.getElementsByClassName("close")[1];

citationsSpan.onclick = function() {
	citationsModal.classList.remove("show");
}

document.addEventListener('keydown', function(event) {
	if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
		citationsModal.classList.add("show");
		event.preventDefault();
	}
});

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

    // Calculate total counts
    var totalWordCountNoCitations = WordCount(formattedText);
    var totalCharCountNoCitations = formattedText.length;
    var totalWordCountWithCitations = WordCount(rawText);
    var totalCharCountWithCitations = rawText.length;

    // Calculate selected/current counts
    var wordCountNoCitations = isTextSelected ? WordCount(formattedTextToAnalyze) : totalWordCountNoCitations;
    var charCountNoCitations = isTextSelected ? formattedTextToAnalyze.length : totalCharCountNoCitations;
    var wordCountWithCitations = isTextSelected ? WordCount(textToAnalyze) : totalWordCountWithCitations;
    var charCountWithCitations = isTextSelected ? textToAnalyze.length : totalCharCountWithCitations;

    var totalCitations = isTextSelected ? 
        (textToAnalyze.match(/\(.*?\)/g) || textToAnalyze.match(/（.*?）/g) || []).length :
        window.citationsData.length;
    var includedCitationsCount = isTextSelected ? 
        (textToAnalyze.match(/\(.*?\)/g) || textToAnalyze.match(/（.*?）/g) || []).length :
        window.citationsData.filter(c => c.included).length;

    const citationsLabel = document.getElementById("citationslabel");
    if (totalCitations > 0 && includedCitationsCount < totalCitations) {
        citationsLabel.textContent = `Citations (${includedCitationsCount} of ${totalCitations} detected included)`;
    } else {
        citationsLabel.textContent = "Citations";
    }

    // Update both labels and values
    /*if (isTextSelected) {
        document.getElementById("wordswolabel").innerText = "Words without citations (Selected)";
        document.getElementById("charswolabel").innerText = "Characters without citations (Selected)";
        document.getElementById("wordslabel").innerText = "Words with citations (Selected)";
        document.getElementById("charslabel").innerText = "Characters with citations (Selected)";
    
        document.getElementById("wordCountNoCitationsValue").innerText = `${wordCountNoCitations} of ${totalWordCountNoCitations}`;
        document.getElementById("charCountNoCitationsValue").innerText = `${charCountNoCitations} of ${totalCharCountNoCitations}`;
        document.getElementById("wordCountWithCitationsValue").innerText = `${wordCountWithCitations} of ${totalWordCountWithCitations}`;
        document.getElementById("charCountWithCitationsValue").innerText = `${charCountWithCitations} of ${totalCharCountWithCitations}`;
    } else {
        document.getElementById("wordswolabel").innerText = "Words without citations";
        document.getElementById("charswolabel").innerText = "Characters without citations";
        document.getElementById("wordslabel").innerText = "Words with citations";
        document.getElementById("charslabel").innerText = "Characters with citations";
    
        document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
        document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
        document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
        document.getElementById("charCountWithCitationsValue").innerText = charCountWithCitations;
    }*/

    document.getElementById("citationCountValue").innerText = includedCitationsCount;
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