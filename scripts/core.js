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
	var citationCount = (rawText.match(/\(.*?\)/g) || []).length;

	document.getElementById("wordCountNoCitationsValue").innerText = wordCountNoCitations;
	document.getElementById("charCountNoCitationsValue").innerText = charCountNoCitations;
	document.getElementById("wordCountWithCitationsValue").innerText = wordCountWithCitations;
	document.getElementById("charCountWithCitationsValue").innerText = charCountWithCitations;
	document.getElementById("citationCountValue").innerText = citationCount;

	if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
		localStorage.setItem('rawData', rawText);
	}
}
