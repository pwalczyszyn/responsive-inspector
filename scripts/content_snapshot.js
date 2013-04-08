if (!window.isSnapshotInitialized) {

    window.isSnapshotInitialized = true;

    (function () {

        function getPageInfo(data, callback) {
            callback({
                viewHeight: window.innerHeight,
                viewWidth: window.innerWidth,
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

        function loadIFrame(data, callback) {
            var req = new XMLHttpRequest();
            req.open("GET", chrome.extension.getURL('templates/snapshot.tpl'), true);
            req.onreadystatechange = function () {
                if (req.readyState == 4 && req.status == 200) {

                    var html = req.responseText;
                    html = html.replace('{{title}}', document.title);
                    html = html.replace('{{width}}', window.innerWidth - 20);
                    html = html.replace('{{src}}', window.location.href);

                    console.log('replacing html', html);

                    document.write(html);

                }
            };
            req.send(null);
        }

        chrome.extension.onMessage.addListener(function onMessage(request, sender, callback) {

            if (request) {

                var fn = {
                    'getPageInfo': getPageInfo,
                    'scrollPage': scrollPage,
                    'scrollToTop': scrollToTop,
                    'loadIFrame': loadIFrame
                }[request.type];

                if (fn) {
                    fn(request.data, callback);
                    return true;
                }

            }

        });

    })();

}