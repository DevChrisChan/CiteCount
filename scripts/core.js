function WordCount(str) {
	str = str.trim();
	var count = 0;
	var inWord = false;

	for (var i = 0; i < str.length; i++) {
		if (/[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF]/.test(str[i]) && !/[\u3000-\u303F]/.test(str[i])) { // If the character is Chinese or Japanese and not punctuation
			count++;
			inWord = false;
		} else if (/[\u3000-\u303F]/.test(str[i])) { // If the character is a punctuation mark
			inWord = false;
		} else if (/[\u0E00-\u0E7F]/.test(str[i])) { // If the character is Thai
			if (!inWord) {
				count++;
				inWord = true;
			}
		} else if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str[i])) { // If the character is Arabic
			if (!inWord) {
				count++;
				inWord = true;
			}
		} else if (/\s/.test(str[i])) { // If the character is a space
			inWord = false;
		} else if (/[\w]/.test(str[i])) { // If the character is a word character (alphanumeric or underscore)
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
	document.getElementById("formattedData").value = formattedText;

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
		var downloadButton = document.createElement("button");
		downloadButton.innerText = "Download citation report [beta]";
		downloadButton.onclick = function() {
			var doc = new jsPDF();
			doc.setFont("Helvetica"); doc.setFontSize(22);
			doc.setFontType("bold");
			doc.text("CiteCount Report", 10, 20);
			doc.setFontSize(12);
			doc.text("Word count (no citations): " + wordCountNoCitations, 10, 30);
			doc.text("Character count (no citations): " + charCountNoCitations, 10, 40);
			doc.text("Word count (with citations): " + wordCountWithCitations, 10, 50);
			doc.text("Character count (with citations): " + charCountWithCitations, 10, 60);
			doc.text("Citation count: " + citationCount, 10, 70);
			doc.text("In-text citations:", 10, 80);
			doc.setFontType("normal");
			var y = 90;
			for (var i = 0; i < citations.length; i++) {
				if (y > doc.internal.pageSize.height - 20) {
					doc.addPage();
					y = 20;
				}
				doc.text((i + 1) + ". " + citations[i], 10, y);
				y += 10;
			}
			let date = new Date();
			let year = date.getFullYear();
			let month = ('0' + (date.getMonth() + 1)).slice(-2);
			let day = ('0' + date.getDate()).slice(-2);
			let hour = ('0' + date.getHours()).slice(-2);
			let minute = ('0' + date.getMinutes()).slice(-2);

			let timestamp = year + month + day + '_' + hour + '_' + minute;
			let filename = 'CiteCount_Report_' + timestamp + '.pdf';
			var total_pages = doc.internal.getNumberOfPages();
			for (var i = 1; i <= total_pages; i++) { 
				doc.setPage(i);
				doc.text('Page ' + String(i) + ' of ' + total_pages, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 2);
			}
			doc.save(filename);
		};


		citationList.insertBefore(downloadButton, citationList.firstChild);
		var lineBreak = document.createElement("br");
		citationList.insertBefore(lineBreak, downloadButton.nextSibling);
	} else {
		citationList.innerHTML = "There are currently no in-text citations.";
	}

	if (localStorage.getItem('autoSave') === 'enabled' || localStorage.getItem('AutoSave') === 'enabled') {
		localStorage.setItem('rawData', rawText);
	}
}
