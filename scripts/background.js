var loginToBehance = function loginToBehance() {

    chrome.tabs.create({
        url: 'https://www.behance.net/v2/oauth/authenticate?client_id=qeTtQGLaIAIc2Hnv0sQdYCsGKernSaDL&redirect_uri=http%3A%2F%2Foutof.me&scope=wip_write&state=state'
    }, function (tab) {

        chrome.tabs.onUpdated.addListener(function behanceOAuthTab(tabId, changeInfo, updatedTab) {

            // TODO add error handling
            if (tabId == tab.id && changeInfo.status == 'complete' && updatedTab.url && updatedTab.url.indexOf('?code=') != -1) {

                // We don't need to listen anymore
                chrome.tabs.onUpdated.removeListener(behanceOAuthTab);

                var split = updatedTab.url.split('?')[1].split('&'),
                    props = {};

                for (var i in split) {
                    var propSplit = split[i].split('=');
                    props[propSplit[0]] = propSplit[1];
                }

                var req = new XMLHttpRequest();
                req.open('POST', 'https://www.behance.net/v2/oauth/token', true);
                req.onreadystatechange = function () {
                    if (req.readyState == 4 && req.status == 200) {
                        localStorage.setItem('behance_user_info', req.responseText);
                    }

                    // TODO add error handling
                }

                var data = new FormData();
                data.append('client_id', 'qeTtQGLaIAIc2Hnv0sQdYCsGKernSaDL');
                data.append('client_secret', 'u8XcFRkv8ExgTd_QSFhcS76tJCL1v9Nw');
                data.append('code', props.code);
                data.append('redirect_uri', 'http://outof.me');
                data.append('grant_type', 'authorization_code');

                req.send(data);
            }

        });

    });

}