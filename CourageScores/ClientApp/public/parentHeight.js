window.addEventListener('message', (event) => {
    let iframe = document.querySelector('iframe.auto-adjust-height');
    if (iframe && event && event.data && event.data.height) {
        iframe.height = event.data.height;
    }
});
