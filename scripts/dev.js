function enableDev() {
    localStorage.setItem('lta_do_not_track', "true");
    document.body.style.backgroundColor = "red";
    document.body.style.backgroundImage = "linear-gradient(red 25%, white 25%, white 50%, red 50%, red 75%, white 75%, white 100%)";
    document.body.style.backgroundSize = "100% 40px";
    document.getElementById("identifier").style.display = 'block'
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
        console.log("Browser Information:", browserInfo);
    const debugSpan = document.getElementById('secondarydebug');
                debugSpan.textContent = `[Developer Mode] For internal use only. Unauthorized distribution is prohibited.`;
    
}

function disableDev() {
    document.getElementById("bottom-counters").style.display = 'none'
    localStorage.setItem('lta_do_not_track', "false");
    localStorage.setItem('dev', "false");
    console.log('Disabled developer mode')
    document.getElementById("identifier").style.display = 'none'
    notify('Disabled developer mode.')
}