if (!window.isContentMediaInitialized) {
    window.isContentMediaInitialized = true;

    var media = [],
        style = window.getComputedStyle(document.body);

    for (var i in document.styleSheets) {
        var sheet = document.styleSheets[i];

        // Checking first if media is set on style sheet level
        if (sheet.media && sheet.media.mediaText != '')
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

            // Adding media rule if exists
            if (rule.media && rule.media.mediaText != '')
                media.push({
                    media: rule.media,
                    url: sheet.href
                });
        }
    }

    chrome.runtime.sendMessage({
        type: 'PAGE_INFO',
        media: media,
        fontSize: style['font-size'] // Just in case mqs are in ems
    });
}