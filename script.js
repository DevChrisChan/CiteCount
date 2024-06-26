var text;
var forText;

function FormatText() {
		text = document.getElementById("rawData").value;
		forText = text.replace(/\s*\(.*?\)\s*/g, ' ');
		return forText.trim();
}

function WordCount(str) {
		return str.split(/\s+/).filter(function(word) { return word.length > 0 }).length;
}

function UpdateCounts() {
	var rawText = document.getElementById("rawData").value;
	var formattedText = FormatText(rawText);
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
}

window.onload = UpdateCounts;
