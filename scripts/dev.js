function enableDev() {
    localStorage.setItem('lta_do_not_track', "true");
    console.log('Enabled developer mode')
    notify('Enabled developer mode')
}