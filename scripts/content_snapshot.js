if (!window.isSnapshotInitialized) {

    window.isSnapshotInitialized = true;

    (function () {

        var htmlContent;

        function loadIFrame(data, callback) {

            // Storing initial page content
            htmlContent = document.getElementsByTagName('html')[0].innerHTML

            var req = new XMLHttpRequest();
            req.open("GET", chrome.extension.getURL('templates/snapshot.tpl'), true);
            req.onreadystatechange = function () {
                if (req.readyState == 4 && req.status == 200) {

                    var html = req.responseText;
                    html = html.replace('{{title}}', document.title);
                    html = html.replace(/\{\{width\}\}/gi, data.snapshotWidth);
                    html = html.replace('{{src}}', window.location.href);
                    html = html.replace('{{bg-pattern}}', chrome.extension.getURL('images/bg-pattern.png'));

                    document.write(html);

                    var iframe = document.getElementById('snapshot-iframe');
                    iframe.onload = function () {

                        callback({
                            viewHeight: window.innerHeight,
                            pageHeight: iframe.contentWindow.document.height
                        });

                    }

                }
            };
            req.send(null);
        }

        function scrollPage(data, callback) {
            var iframe = document.getElementById('snapshot-iframe');

            // Scrolling iframe content
            iframe.contentWindow.scrollTo(0, data.y);

            setTimeout(function () {
                callback({
                    currentY: iframe.contentWindow.document.body.scrollTop
                });
            }, 500);
        }

        function restore(data, callback) {

            // Restoring initial content
            var doc = document.open("text/html", "replace");
            doc.write(htmlContent);
            doc.close();

            // Sending callback ater restore
            callback(true);
        }

        chrome.extension.onMessage.addListener(function onMessage(request, sender, callback) {

            if (request) {

                var fn = {
                    'loadIFrame': loadIFrame,
                    'scrollPage': scrollPage,
                    'restore': restore
                }[request.type];

                if (fn) {
                    fn(request.data, callback);
                    return true;
                }

            }

        });

    })();

}