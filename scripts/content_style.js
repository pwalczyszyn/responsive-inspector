// Appending prettify.css
var link = document.createElement('link');
link.setAttribute('rel', 'stylesheet');
link.setAttribute('type', 'text/css');
link.setAttribute('href', chrome.extension.getURL('scripts/libs/prettify.css'));
(document.getElementsByTagName('head')[0]).appendChild(link);

// Setting prettyprint class
document.getElementsByTagName('pre')[0].className = 'prettyprint lang-css';

// Styling body to match css part
document.getElementsByTagName('body')[0].style['background-color'] = '#302F2D';

// Listening for messages from extension
chrome.runtime.onMessage.addListener(function (message, sender, callback) {
    if (message.type == 'prettyPrint') {
        prettyPrint(function () {
            window.find(message.data);
        });
    }
});