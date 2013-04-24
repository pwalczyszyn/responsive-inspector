var TabsUpdateListener = function TabsUpdateListener() {
    chrome.webNavigation.onCompleted.addListener(this.navigation_completeHandler.bind(this));
    chrome.runtime.onMessage.addListener(this.contentScript_executedHandler.bind(this));
};

TabsUpdateListener.prototype = {
    navigation_completeHandler: function (details) {
        if (details.frameId == 0) {
            console.log('update complete', details.url);
            chrome.tabs.executeScript(details.tabId, {
                file: "scripts/content_media.js"
            });
        }
    },

    contentScript_executedHandler: function (message, sender, callback) {
        if (message.type == 'PAGE_INFO') {
            //            console.log(message.fontSize);

        }
    }
}

var tabsListener = new TabsUpdateListener;