var TabInfo = function TabInfo(tabId) {
    this.tabId = tabId;
    this.mediaQueries = [];
    this.status = 'loading';
    this.onStatusUpdate = null;
    this.activeLoaders = 0;
    this.loadedURLs = [];
    this.errors = [];
}
TabInfo.prototype = {
    updateStatus: function updateStatus() {
        if (this.activeLinkLoaders == 0)
            this.status = 'complete';
        if (this.onStatusUpdate)
            this.onStatusUpdate(this);
    }
}

var TabsUpdateListener = function TabsUpdateListener() {

    // Constructing new tabs info map
    this.tabInfos = {};

    // Listening to navigation events
    chrome.webNavigation.onBeforeNavigate.addListener(this.navigation_beforeNavigateHandler.bind(this), {
        url: [{
                schemes: ['http', 'https', 'file']
            }]
    });
    chrome.webNavigation.onCompleted.addListener(this.navigation_completeHandler.bind(this), {
        url: [{
                schemes: ['http', 'https', 'file']
            }]
    });

    // Listening for messages from content script
    chrome.runtime.onMessage.addListener(this.pageInfo_messageHandler.bind(this));

    // Listening to closing tab
    chrome.tabs.onRemoved.addListener(this.tab_removeHandler.bind(this));

};

TabsUpdateListener.prototype = {

    tab_removeHandler: function tab_removeHandler(tabId, removeInfo) {
        delete this.tabInfos[tabId];
    },

    getTabInfo: function getTabInfo(tabId) {
        return this.tabInfos[tabId];
    },

    navigation_beforeNavigateHandler: function navigation_beforeNavigateHandler(details) {
        if (details.frameId == 0) {
            this.tabInfos[details.tabId] = new TabInfo(details.tabId);
        }
    },

    navigation_completeHandler: function (details) {
        if (details.frameId == 0) {
            // Executing script on newly opened url
            chrome.tabs.executeScript(details.tabId, {
                file: 'scripts/content_media.js'
            });
        }
    },

    pageInfo_messageHandler: function pageInfo_messageHandler(message, sender, callback) {
        if (message.type == 'PAGE_INFO') {

            var tabInfo = this.tabInfos[sender.tab.id];

            for (var i in message.styleSheets) {
                var styleSheet = message.styleSheets[i];
                if (styleSheet.type == 'style') {

                    try {
                        var cssRules = (new CSSParser(styleSheet.innerText)).parse();
                        this.processCSSRules(cssRules, tabInfo, message.url);
                    } catch (error) {
                        this.processParsingError(error, tabInfo, styleSheet);
                    }

                } else if (styleSheet.type == 'link') {

                    // In case media query is defined on link level
                    if (styleSheet.mediaText != '') {

                        try {

                            var linkRule = {
                                type: 'CSSLinkRule',
                                mediaText: styleSheet.mediaText,
                                innerText: styleSheet.innerText,
                                mediaQueryList: (new CSSParser('')).parseMediaQueryList(styleSheet.mediaText)
                            };

                            // Adding to media queries list
                            tabInfo.mediaQueries.push(linkRule);

                        } catch (error) {
                            this.processParsingError(error, tabInfo, styleSheet);
                        }

                    }

                    // Loading link content
                    this.loadLinkCSS(styleSheet);
                }
            }

            // Updating status, if everything was loaded it will dispatch 'complete' event
            tabInfo.updateStatus();

        }
    },

    processCSSRules: function processCSSRules(cssRules, tabInfo, url) {
        for (var i in cssRules) {
            var rule = cssRules[i];
            if (rule.type == 'CSSImportRule') {
                //                console.log('



            } else {

            }
        }
    },

    processParsingError: function processParsingError(error, tabInfo, styleSheet) {

    },

    loadExternalCSS: function loadExternalCSS(url, onLoad, onError, tabInfo) {
        tabInfo.activeLoaders++;

        var cssReq = new XMLHttpRequest();
        cssReq.onload = onLoad;
        cssReq.onerror = onError;
        cssReq.open('get', url, true);
        cssReq.send();
    },

    loadLinkCSS: function loadLinkCSS(styleSheet) {

        var cssReq = new XMLHttpRequest();
        cssReq.onload = function (e) {
            (new CSSParser(cssReq.responseText)).parse();
        }.bind(this);

        cssReq.onerror = function (e) {
            console.error('Error fetching css:', e);
        }.bind(this);

        cssReq.open("get", styleSheet.url, true);
        cssReq.send();

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