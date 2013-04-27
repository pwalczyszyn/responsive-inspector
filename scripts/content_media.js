if (!window.isContentMediaInitialized) {
    window.isContentMediaInitialized = true;

    var styleSheets = [],
        style = window.getComputedStyle(document.body);

    for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        styleSheets.push({
            url: sheet.href,
            type: sheet.ownerNode.tagName.toLowerCase(),
            mediaText: sheet.media.mediaText,
            innerText: sheet.ownerNode.innerText
        });
    }

    chrome.runtime.sendMessage({
        type: 'PAGE_INFO',
        styleSheets: styleSheets,
        fontSize: style['font-size'] // Just in case mqs are in EMs
    });
}