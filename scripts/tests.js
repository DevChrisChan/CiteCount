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
