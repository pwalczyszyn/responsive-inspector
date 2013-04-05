if (!window.isSnapshotInitialized) {

    window.isSnapshotInitialized = true;

    (function () {

        function getPageInfo(data, callback) {
            callback({
                viewHeight: innerHeight,
                viewWidth: innerWidth,
                pageHeight: document.height
            });
        }

        function scrollPage(data, callback) {
            scrollTo(0, data.y);

            setTimeout(function () {
                callback({
                    currentY: document.body.scrollTop
                });
            }, 1000);
        }

        function scrollToTop(data, callback) {
            scrollTo(0, 0);
            callback(true);
        }

        chrome.runtime.onMessage.addListener(function onMessage(request, sender, callback) {

            if (request) {

                var fn = {
                    'getPageInfo': getPageInfo,
                    'scrollPage': scrollPage,
                    'scrollToTop': scrollToTop
                }[request.type];

                if (fn) {
                    fn(request.data, callback);
                    return true;
                }

            }

        });

    })();

}