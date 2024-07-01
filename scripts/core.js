function WordCount(str) {
	str = str.trim();
	return str.length > 0 ? str.split(/\s+/).length : 0;
}


function UpdateCounts() {
	var rawText = document.getElementById("rawData").value;
	rawText = rawText.replace(/ +/g, ' ');
	var formattedText = rawText.replace(/\s*\(.*?\)\s*/g, '');
	document.getElementById("formattedData").value = formattedText;

	var wordCountNoCitations = WordCount(formattedText);
	var charCountNoCitations = formattedText.length;
	var wordCountWithCitations = WordCount(rawText);
	var charCountWithCitations = rawText.length;
	var citations = rawText.match(/\(.*?\)/g) || [];
	var citationCount = citations.length;

	document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
	document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
	document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
	document.getElementById("charCountWithCitationsValue").innerText = charCountWithCitations;
	document.getElementById("citationCountValue").innerText = citationCount;

	// Display citations in the citationList div as a numbered list
	var citationList = document.getElementById("citationList");
	if (citations.length > 0) {
		citationList.innerHTML = citations.map((citation, index) => `<span style="user-select: none;">${index + 1}.</span> ${citation}`).join('<br>');
	} else {
		citationList.innerHTML = "There are currently no in-text citations.";
	}

	if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
		localStorage.setItem('rawData', rawText);
	}
}
