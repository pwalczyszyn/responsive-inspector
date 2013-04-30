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
                        var styleMQs = (new CSSParser(styleSheet.innerText, message.url)).parse();
                        this.processCSSRules(styleMQs, tabInfo, message.url);
                    } catch (error) {
                        this.processParsingError(error, tabInfo, styleSheet);
                    }

                } else if (styleSheet.type == 'link') {

                    var linkMQs;

                    // In case media query is defined on link level
                    if (styleSheet.mediaText != '') {

                        try {
                            // parseMediaQueryList(type, mediaText, cssText, href, declarationText)

                            var linkMQs = (new CSSParser('', message.url)).parseMediaQueryList(
                                'CSSLinkRule',
                                styleSheet.mediaText,
                                null,
                                styleSheet.url,
                                styleSheet.innerText);

                            // Adding to media queries list
                            // tabInfo.mediaQueries.push(linkRule);

                        } catch (error) {
                            this.processParsingError(error, tabInfo, styleSheet);
                        }

                    }

                    this.loadLinkContent(styleSheet.url, message.url, linkMQs, tabInfo);

                }
            }

            // Updating status, if everything was loaded it will dispatch 'complete' event
            tabInfo.updateStatus();

        }
    },

    loadLinkContent: function loadLinkContent(url, declarationUrl, linkMQs, tabInfo) {
        // Loading link content
        this.loadExternalCSS(url, function (responseText) {

            console.log('Got link result...', tabInfo);

            var cssRules = (new CSSParser(responseText, declarationUrl)).parse();
            this.processCSSRules(cssRules, tabInfo, url);

            for (var i in linkMQs) {
                var mq = linkMQs[i];
                mq.cssText = responseText;
            }

            tabInfo.mediaQueries.push.apply(tabInfo.mediaQueries, linkMQs);

            tabInfo.activeLoaders--;
            tabInfo.updateStatus();

        }, function (statusText) {
            console.log('Error link css:', statusText);
        }, tabInfo);
    },

    processCSSRules: function processCSSRules(cssRules, tabInfo, url) {
        for (var i in cssRules) {
            var rule = cssRules[i];
            if (rule.type == 'CSSImportRule') {

                var importUrl;
                // Absolute path
                if (rule.href.indexOf('http://') == 0 || rule.href.indexOf('https://') == 0 || rule.href.indexOf('file://') == 0) {
                    importUrl = rule.href;
                } else if (rule.href.indexOf('/') == 0) { // Relative to root
                    var rooEnd = url.indexOf('/', url.indexOf('://') + 3);
                    if (rooEnd == -1)
                        importUrl = url + rule.href;
                    else
                        importUrl = url.substring(0, rooEnd) + rule.href;
                } else { // Relative path
                    var rooEnd = url.indexOf('/', url.indexOf('://') + 3);
                    if (rooEnd == -1)
                        importUrl = url + '/' + rule.href;
                    else
                        importUrl = url.substring(0, url.lastIndexOf('/') + 1) + rule.href;
                }

                this.loadExternalCSS(importUrl, function (responseText) {
                    console.log('Got import result...');
                }, function (statusText) {
                    console.log('Error importing css:', statusText);
                }, tabInfo);

            } else {

            }
        }
    },

    processParsingError: function processParsingError(error, tabInfo, styleSheet) {
        console.log('Error parsing CSS', error);
    },

    loadExternalCSS: function loadExternalCSS(url, onLoad, onError, tabInfo) {
        tabInfo.activeLoaders++;

        console.log('Loading external CSS:', url);

        var cssReq = new XMLHttpRequest();
        cssReq.onload = function (event) {
            onLoad.call(this, event.target.responseText);
        }.bind(this);
        cssReq.onerror = function (error) {
            onError.call(this, error.target.responseText);
        }.bind(this);
        cssReq.open('GET', url, true);
        cssReq.send();
    }

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