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

function SetCountText(formattedText) {
		var count = WordCount(formattedText);
		document.getElementById("result").innerHTML = 'With no citations, your text is <b>' + count + '</b> words long';
}

function UpdateWordCount() {
		var formattedText = FormatText();
		document.getElementById("formattedData").value = formattedText;
		SetCountText(formattedText);
}

window.onload = UpdateWordCount;
