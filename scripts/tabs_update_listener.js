var TabsUpdateListener = function TabsUpdateListener() {
    chrome.webNavigation.onCompleted.addListener(this.navigation_completeHandler.bind(this));
    chrome.runtime.onMessage.addListener(this.pageInfo_messageHandler.bind(this));
};

TabsUpdateListener.prototype = {
    navigation_completeHandler: function (details) {
        if (details.frameId == 0) {
            // Executing script on newly opened url
            chrome.tabs.executeScript(details.tabId, {
                file: "scripts/content_media.js"
            });
        }
    },

    pageInfo_messageHandler: function (message, sender, callback) {
        if (message.type == 'PAGE_INFO') {
            console.log(sender.tab.id, sender.tab.url);

        }
    },

    //    loadDataStorage_: function () {
    //        chrome.storage.local.get({
    //            "completed": {},
    //            "errored": {},
    //        }, function (storage) {
    //            this.completed_ = storage.completed;
    //            this.errored_ = storage.errored;
    //        }.bind(this));
    //    },

    //    saveDataStorage_: function() {
    //	    chrome.storage.local.set({
    //	      "completed": this.completed_,
    //	      "errored": this.errored_,
    //	    });
    //	  }

}

var tabsListener = new TabsUpdateListener;

//chrome.runtime.onStartup.addListener(function () {
//    nav.resetDataStorage();
//});