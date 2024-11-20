function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.

	for (var i = 0, f; f = files[i]; i++) {
		// Only process word documents.
		if (!f.name.endsWith('.doc') && !f.name.endsWith('.docx')) {
			notify("Sorry, only Word documents (.docx and .doc) are accepted.")
			document.getElementById('overlay').style.display = 'none';
			return;
		}

		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
				var arrayBuffer = e.target.result;
				mammoth.extractRawText({arrayBuffer: arrayBuffer})
					.then(function(resultText) {
						document.getElementById('rawData').value = resultText.value;
						UpdateCounts();
						notify(theFile.name + ' has been imported to CiteCount.')
					})
					.done();
			};
		})(f);
		reader.readAsArrayBuffer(f);
	}
	document.getElementById('overlay').style.display = 'none';
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
	document.getElementById('overlay').style.display = 'flex';
}

function handleDragLeave(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	if (evt.relatedTarget === null || evt.relatedTarget.nodeName === 'HTML') {
		document.getElementById('overlay').style.display = 'none';
	}
}

document.body.addEventListener('dragover', handleDragOver, false);
document.body.addEventListener('dragleave', handleDragLeave, false);
document.body.addEventListener('drop', handleFileSelect, false);