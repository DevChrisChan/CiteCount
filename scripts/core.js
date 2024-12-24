/* © 2024 CiteCount. All rights reserved. No parts of this code can be reproduced without permission by the developer. */

function WordCount(str) {
    str = str.trim();
    var count = 0;
    var inWord = false;
    var language = '';

    if (/[\u4e00-\u9fa5]/.test(str)) {
        language = 'Chinese';
        document.getElementById("wwc").textContent = "Words without citations (Chinese words)";
    } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(str)) {
        language = 'Japanese';
        document.getElementById("wwc").textContent = "Words without citations (Japanese words)";
    } else {
        document.getElementById("wwc").textContent = "Words without citations";
    }

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

window.onload = function() {
    const savedText = localStorage.getItem('rawData');
    if (savedText) {
        document.getElementById("rawData").value = savedText;
    }
    UpdateCounts();
};

function UpdateCounts() {

    var textarea = document.getElementById("rawData");
    var rawText = textarea.value;
    var selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    var isTextSelected = selectedText.length > 0;
    if (rawText == "!dev") {
        localStorage.setItem('dev', 'enabled');
        notify('Restarting soon for effects to take.')
        setTimeout(function(){
            document.getElementById("rawData").value = "";
            localStorage.removeItem('rawData')
        }, 300);
        
        setTimeout(function(){
            window.location.reload()
        }, 500);
    }
    if (rawText == "!stop") {
        disableDev();
        notify('Restarting soon for effects to take.')
        setTimeout(function(){
            document.getElementById("rawData").value = "";
            localStorage.removeItem('rawData')
        }, 300);
        
        setTimeout(function(){
            window.location.reload()
        }, 500);
    }
    if (localStorage.getItem('dev') === "enabled") {
        const browserInfo = {
            browserName: navigator.appName,
            browserVersion: navigator.userAgent,
            platform: navigator.platform,
        };
    
        /*let memoryInfo;
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        
        if (isChrome) {
            memoryInfo = window.performance.memory;
        }*/
    
        function buildTable() {
            const tableContainer = document.getElementById('tableContainer');
            tableContainer.innerHTML = ''; 
    
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
    
            const headerRow = document.createElement('tr');
            const headerKey = document.createElement('th');
            const headerValue = document.createElement('th');
    
            headerKey.textContent = 'Key';
            headerValue.textContent = 'Value';
    
            headerRow.appendChild(headerKey);
            headerRow.appendChild(headerValue);
            thead.appendChild(headerRow);
            table.appendChild(thead);
    
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
    
                const row = document.createElement('tr');
                const cellKey = document.createElement('td');
                const cellValue = document.createElement('td');
    
                cellKey.textContent = key;
                cellValue.textContent = value;
    
                row.appendChild(cellKey);
                row.appendChild(cellValue);
                tbody.appendChild(row);
            }
    
            table.appendChild(tbody);
            tableContainer.appendChild(table);
        }
        buildTable(); 
        /*function logMemoryUsage() {
            if (isChrome && memoryInfo) {
                const totalHeapSize = memoryInfo.totalJSHeapSize / (1024 ** 2); 
                const usedHeapSize = memoryInfo.usedJSHeapSize / (1024 ** 2);  
                const heapSizeLimit = memoryInfo.jsHeapSizeLimit / (1024 ** 2); 
                const usagePercentage = ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2); 
    
               
    
                const debugSpan = document.getElementById('debug');
                debugSpan.textContent = `Total: ${totalHeapSize.toFixed(2)} MB, Used: ${usedHeapSize.toFixed(2)} MB, Limit: ${heapSizeLimit.toFixed(2)} MB, Usage: ${usagePercentage}%`;
            } else {
                const debugSpan = document.getElementById('debug');
                debugSpan.textContent = "Memory debug only available on Chrome.";
            }
        }
    
        setInterval(logMemoryUsage, 1000);*/
    }
    
    rawText = rawText.replace(/ +/g, ' ');
    var citations = rawText.match(/\(.*?\)/g) || rawText.match(/（.*?）/g) || [];
    if (!window.citationsData) {
        const savedCitationStates = localStorage.getItem('citationStates');
        if (savedCitationStates) {
            const savedStates = JSON.parse(savedCitationStates);
            window.citationsData = citations.map(citation => ({
                text: citation,
                wordCount: WordCount(citation),
                included: savedStates[citation] !== undefined ? savedStates[citation] : true
            }));
        } else {
            window.citationsData = citations.map(citation => ({
                text: citation,
                wordCount: WordCount(citation),
                included: true
            }));
        }
    } else {
        const existingStates = {};
        window.citationsData.forEach(citation => {
            existingStates[citation.text] = citation.included;
        });

        window.citationsData = citations.map(citation => ({
            text: citation,
            wordCount: WordCount(citation),
            included: existingStates[citation] !== undefined ? existingStates[citation] : true
        }));
    }

    recalculateAllCounts(isTextSelected, selectedText);
}



function areAllCitationsSelected() {
    return window.citationsData.every(citation => citation.included);
}

function toggleAllCitations() {
    const newState = !areAllCitationsSelected();
    window.citationsData.forEach(citation => {
        citation.included = newState;
    });
    
    const citationStates = {};
    window.citationsData.forEach(citation => {
        citationStates[citation.text] = citation.included;
    });
    localStorage.setItem('citationStates', JSON.stringify(citationStates));
    recalculateAllCounts();
}
function updateCitationInclusion(citationIndex) {
    const checkbox = document.getElementById(`citation-${citationIndex}`);
    window.citationsData[citationIndex].included = checkbox.checked;
    
    const citationStates = {};
    window.citationsData.forEach(citation => {
        citationStates[citation.text] = citation.included;
    });
    localStorage.setItem('citationStates', JSON.stringify(citationStates));
    
    recalculateAllCounts();
}


document.getElementById("rawData").addEventListener('mouseup', function() {
    setTimeout(() => {
        UpdateCounts();
    }, 0);
});

document.getElementById("rawData").addEventListener('keyup', function() {
    UpdateCounts();

});

document.getElementById("rawData").addEventListener('click', function() {
    setTimeout(() => {
        if (!window.getSelection().toString()) {
            UpdateCounts();
        }
    }, 0);

});

document.getElementById("rawData").addEventListener('blur', function() {
    UpdateCounts();
});