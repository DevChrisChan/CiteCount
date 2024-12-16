function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    // Check if dataTransfer has files
    if (!evt.dataTransfer.files.length) {
        return; // Ignore if no files are present
    }

    var files = evt.dataTransfer.files; // FileList object.

    for (var i = 0, f; f = files[i]; i++) {
        // Only process Word documents and PDF files.
        if (!f.name.endsWith('.doc') && !f.name.endsWith('.docx') && !f.name.endsWith('.pdf')) {
            notify("Only Word documents (.docx and .doc) and PDF files (.pdf) are accepted.");
            document.getElementById('overlay').style.display = 'none';
            return;
        }

        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                var arrayBuffer = e.target.result;

                // Check the file type and process accordingly
                if (theFile.name.endsWith('.doc') || theFile.name.endsWith('.docx')) {
                    mammoth.extractRawText({arrayBuffer: arrayBuffer})
                        .then(function(resultText) {
                            document.getElementById('rawData').value = resultText.value;
                            UpdateCounts();
                            notify(theFile.name + ' has been imported to CiteCount.');
                        })
                        .done();
                } else if (theFile.name.endsWith('.pdf')) {
                    // Use pdf.js to extract text from the PDF file
                    pdfjsLib.getDocument({data: arrayBuffer}).promise.then(function(pdf) {
                        let textPromises = [];
                        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            textPromises.push(pdf.getPage(pageNum).then(function(page) {
                                return page.getTextContent().then(function(textContent) {
                                    return textContent.items.map(item => item.str).join(' ');
                                });
                            }));
                        }
                        return Promise.all(textPromises);
                    }).then(function(pagesText) {
                        document.getElementById('rawData').value = pagesText.join('\n');
                        UpdateCounts();
                        notify(theFile.name + ' has been imported to CiteCount.');
                    });
                }
            };
        })(f);
        reader.readAsArrayBuffer(f);
    }
    document.getElementById('overlay').style.display = 'none';
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    // Check if the dragged item is a file
    if (evt.dataTransfer.types.includes('Files')) {
        evt.dataTransfer.dropEffect = 'copy';
        document.getElementById('overlay').style.display = 'flex';
    } else {
        evt.dataTransfer.dropEffect = 'none'; // Ignore non-file items
    }
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