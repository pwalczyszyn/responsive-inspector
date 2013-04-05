//function getMedia() {

var media = [];

for (var i in document.styleSheets) {
    var sheet = document.styleSheets[i];

    // Checking first if media is set on style sheet level
    // and has width settings
    if (sheet.media && sheet.media.mediaText.indexOf('width') >= 0)
        media.push({
            media: sheet.media,
            url: sheet.href
        });

    // Case when css in different domain
    if (!sheet.cssRules && sheet.href)
        media.push({
            url: sheet.href
        });

    // Filtering media from available cssRules
    for (var j in sheet.cssRules) {
        var rule = sheet.cssRules[j];

        // Adding media rule that has width settings
        if (rule.media && rule.media.mediaText.indexOf('width') >= 0)
            media.push({
                media: rule.media,
                url: sheet.href
            });
    }

}

// Send results back to popup
chrome.runtime.sendMessage({
    type: 'media',
    data: media
});

//}
//
//chrome.extension.onMessage.addListener(function (message, sender, callback) {
//
//    switch (message.type) {
//
//        case 'getMedia':
//            getMedia();
//            break;
//
//    }
//
//});