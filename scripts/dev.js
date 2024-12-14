function enableDev() {
    localStorage.setItem('lta_do_not_track', "true");
    document.body.style.backgroundColor = "red";
    document.body.style.backgroundImage = "linear-gradient(red 25%, white 25%, white 50%, red 50%, red 75%, white 75%, white 100%)";
    document.body.style.backgroundSize = "100% 40px";

    console.log('Enabled developer mode')
    notify('Enabled developer mode.')
    const browserInfo = {
        browserName: navigator.appName,
        browserVersion: navigator.userAgent,
        onlineStatus: navigator.onLine,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        availableWidth: window.screen.availWidth,
        availableHeight: window.screen.availHeight,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        performanceTiming: window.performance ? window.performance.timing : null,
        navigationType: window.performance ? window.performance.navigation.type : null
    };
    if (performance.memory) {
        const memoryInfo = performance.memory;
    
        // Function to log comprehensive memory usage
        function logMemoryUsage() {
            const totalHeapSize = memoryInfo.totalJSHeapSize / (1024 ** 2); // Convert to MB
            const usedHeapSize = memoryInfo.usedJSHeapSize / (1024 ** 2);   // Convert to MB
            const heapSizeLimit = memoryInfo.jsHeapSizeLimit / (1024 ** 2); // Convert to MB
            const usagePercentage = ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2); // Percentage
    
            console.log("=== Memory Usage Information ===");
            console.log(`Total JS Heap Size: ${totalHeapSize.toFixed(2)} MB`);
            console.log(`Used JS Heap Size: ${usedHeapSize.toFixed(2)} MB`);
            console.log(`JS Heap Size Limit: ${heapSizeLimit.toFixed(2)} MB`);
            console.log(`Memory Usage Percentage: ${usagePercentage}%`);
            console.log("===============================");
        }
    
        logMemoryUsage();
        
    } else {
        console.log("Memory information is not available in this browser.");
    }
    
    console.log("Browser Information:", browserInfo);
    const debugSpan = document.getElementById('secondarydebug');
                debugSpan.textContent = `[Developer Mode] For internal use only. Unauthorized distribution is prohibited.`;
    
}

function disableDev() {
    document.getElementById("bottom-counters").style.display = 'none'
    localStorage.setItem('lta_do_not_track', "false");
    localStorage.setItem('dev', "false");
    console.log('Disabled developer mode')
    notify('Disabled developer mode.')
}