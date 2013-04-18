var loginToBehance = function loginToBehance() {

    var CLIENT_ID = 'qeTtQGLaIAIc2Hnv0sQdYCsGKernSaDL',
        CLIENT_SECRET = 'RseEnuSdTpDiqU9ognSVZUQ4sTCd8.QX',
        REDIRECT_URI = 'http://outof.me/responsive-inspector/behance';

    chrome.tabs.create({
        url: 'https://www.behance.net/v2/oauth/authenticate?client_id=' + CLIENT_ID + '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) + '&scope=wip_write&state=processing'
    }, function (tab) {

        chrome.tabs.onUpdated.addListener(function behanceOAuthTab(tabId, changeInfo, updatedTab) {

            if (tabId == tab.id && changeInfo.status == 'complete') {

                // Tab new url starts with REDIRECT_URI
                if (updatedTab.url.indexOf(REDIRECT_URI) == 0) {
                    // We don't need to listen anymore
                    chrome.tabs.onUpdated.removeListener(behanceOAuthTab);

                    var urlSplit = updatedTab.url.split('?');
                    if (urlSplit.length == 2) {

                        // Parsing tab url
                        var pairs = urlSplit[1].split('&'),
                            props = {};
                        for (var i in pairs) {
                            var pair = pairs[i].split('=');
                            if (pair.length == 2)
                                props[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                        }

                        // Authorization was successful
                        if (props.code) {
                            var req = new XMLHttpRequest();
                            req.open('POST', 'https://www.behance.net/v2/oauth/token', true);
                            req.onreadystatechange = function () {
                                if (req.readyState == 4) { // request complete
                                    if (req.status == 200) { // request OK
                                        // Storing user info
                                        chrome.storage.sync.set({
                                            'behance_user_info': JSON.parse(req.responseText)
                                        }, function () {
                                            // Updating tab with state complete
                                            chrome.tabs.update(tabId, {
                                                url: REDIRECT_URI + '?state=complete'
                                            });
                                        });
                                    } else { // request NOT OK
                                        // Updating tab with error code
                                        chrome.tabs.update(tabId, {
                                            url: REDIRECT_URI + '?error=token_error&error_reason=' + req.status + '&error_message=' + req.statusText.replace(' ', '+')
                                        });
                                    }
                                }
                            }

                            var data = new FormData();
                            data.append('client_id', CLIENT_ID);
                            data.append('client_secret', CLIENT_SECRET);
                            data.append('code', props.code);
                            data.append('redirect_uri', REDIRECT_URI);
                            data.append('grant_type', 'authorization_code');

                            // Sending request
                            req.send(data);

                        } else if (props.error) {
                            // Error is handled in the webpage
                        } else {
                            // This is handled in the webpage
                        }
                    }
                }
            }
        });
    });
}

var openStyleSheet = function openStyleSheet(mq) {

    // Creating new tab
    chrome.tabs.create({
        url: mq.url,
        active: true
    }, function (t) {

        // Executing content script
        chrome.tabs.executeScript(t.id, {
            file: "scripts/libs/prettify.js"
        }, function () {

            // Loading content_style.js
            chrome.tabs.executeScript(t.id, {
                file: "scripts/content_style.js"
            }, function () {

                // Sending message to pretty print and to find mediaText
                chrome.tabs.sendMessage(t.id, {
                    type: 'prettyPrint',
                    data: mq.wholeMediaText
                });

            });

        });

    });

}