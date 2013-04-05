console.log('bg script init');

chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message) {
        
        console.log('bg received message');
        
    });
});