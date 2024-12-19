function enableDev() {
    localStorage.setItem('lta_do_not_track', "true");
    document.body.style.backgroundColor = "yellow";
    document.body.style.backgroundImage = "linear-gradient(45deg, yellow 25%, black 25%, black 50%, yellow 50%, yellow 75%, black 75%, black 100%)";
    document.body.style.backgroundSize = "40px 40px";
    document.body.style.border = "3px solid red";
    document.body.style.margin = "0"; 
    document.body.style.height = "100vh"; 
    document.getElementById("identifier").style.display = 'block'
    console.log('Enabled developer mode')
    notify('Enabled developer mode.')
   
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