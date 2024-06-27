function WordCount(str) {
	return str.length > 0 ? str.trim().split(/\s+/).length : 0;
}

function UpdateCounts() {
	var rawText = document.getElementById("rawData").value;
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

	localStorage.setItem('rawData', rawText);
}

// REMOVE FROM PRODUCTION

var testCases = [
		{ text: "This is a test sentence (Citation 1).", expected: 5 },
		{ text: "This is a test sentence (Citation 1). This is another test sentence (Citation 2).", expected: 10 },
	{ text: "This is a test sentence (Citation 1)(Citation 2).", expected: 5 },
		{ text: "This is a test sentence(Citation 1).This is another test sentence(Citation 2).", expected: 10 },
		{ text: "This is a test sentence. This is another test sentence with a citation attached to a word(Citation 1).", expected: 17 }
];

function runTests() {
		for (var i = 0; i < testCases.length; i++) {
				var testCase = testCases[i];
				document.getElementById("rawData").value = testCase.text;
				UpdateCounts();
				var wordCountNoCitations = parseInt(document.getElementById("wordCountNoCitationsValue").innerText);
				if (wordCountNoCitations === testCase.expected) {
						console.log("Test Case " + (i + 1) + ": Passed");
				} else {
						console.log("Test Case " + (i + 1) + ": Failed (Expected " + testCase.expected + ", Got " + wordCountNoCitations + ")");
				}
		}
}

// REMOVE FROM PRODUCTION

window.onload = function() {
	var savedText = localStorage.getItem('rawData');
	if (savedText) {
		document.getElementById('rawData').value = savedText;
	}
	UpdateCounts();
};

window.addEventListener('resize', function() {
		if (window.innerWidth < 768) {
				document.querySelector('textarea').style.height = ""; 
		} else {
				document.querySelector('textarea').style.width = "";
		}
});
