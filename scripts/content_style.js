
document.getElementsByTagName('pre')[0].className = 'prettyprint lang-css'

var script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.extension.getURL('scripts/libs/run_prettify.js') + '?lang=css');

var head = document.getElementsByTagName('head')[0];
head.appendChild(script);
