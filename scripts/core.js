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
    var rawText = document.getElementById("rawData").value;
    rawText = rawText.replace(/ +/g, ' ');
    var formattedText = rawText.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*（.*?）\s*/g, '');
    //document.getElementById("formattedData").value = formattedText;

    var wordCountNoCitations = WordCount(formattedText);
    var charCountNoCitations = formattedText.length;
    var wordCountWithCitations = WordCount(rawText);
    var charCountWithCitations = rawText.length;
    var citations = rawText.match(/\(.*?\)/g) || rawText.match(/（.*?）/g) || [];
    var citationCount = citations.length;

    document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
    document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
    document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
    document.getElementById("charCountWithCitationsValue").innerText = charCountWithCitations;
    document.getElementById("citationCountValue").innerText = citationCount;

    var citationList = document.getElementById("citationList");
    if (citations.length > 0) {
        citationList.innerHTML = citations.map((citation, index) => `<span style="user-select: none;">${index + 1}.</span> ${citation}`).join('<br>');
    } else {
        citationList.innerHTML = "There are currently no in-text citations.";
    }

    // Save to local storage if enabled
    if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
        localStorage.setItem('rawData', rawText);
    }
}
