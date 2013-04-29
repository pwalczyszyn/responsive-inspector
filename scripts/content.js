if (!window.isResponsiveInspectorInitialized) {

    window.isResponsiveInspectorInitialized = true;

    (function () {

        function getMedia(callback) {

            var media = [];

            for (var i in document.styleSheets) {
                var sheet = document.styleSheets[i];

                // Checking first if media is set on style sheet level
                // and has width settings
                if (sheet.media && sheet.media.mediaText.indexOf('width') >= 0)
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

                    // Adding media rule that has width settings
                    if (rule.media && rule.media.mediaText.indexOf('width') >= 0)
                        media.push({
                            media: rule.media,
                            url: sheet.href
                        });
                }

            }

            callback(media);
        }

        function popupSaveDialog(data) {
            var a = document.createElement('a');
            a.href = data.path;
            a.download = 'snapshot.png'; // Filename
            a.target = '_blank';
            a.click();
        }

        function showResolution(data) {
            var div = document.getElementById('responsive-inspector-resolution-info');
            (div && document.body.removeChild(div));

            div = document.createElement('div');
            div.id = 'responsive-inspector-resolution-info';
            div.innerHTML = '<span style="float:left; padding-left:15px; line-height:80px">⇤</span><span style="line-height:80px"> ' + window.innerWidth + 'px </span><span style="float:right; padding-right:15px; line-height:80px">⇥</span>';
            div.style['position'] = 'fixed';
            div.style['width'] = '220px';
            div.style['height'] = '80px';
            div.style['text-align'] = 'center';
            div.style['font'] = '30px verdana';
            div.style['right'] = '23px';
            div.style['bottom'] = '23px';
            div.style['border-radius'] = '7px';
            div.style['background-color'] = '#ddd';
            div.style['opacity'] = 0;
            div.style['color'] = '#fff';
            div.style['transition'] = 'opacity 0.5s linear 0s';
            document.body.appendChild(div);

            var targetOpacity = 0.95;

            div.addEventListener('transitionend', function transitionendHandler(event) {
                if (this.style.opacity == targetOpacity) {
                    div.style['transition-delay'] = '1.5s';
                    div.style['opacity'] = 0;
                } else {
                    this.removeEventListener('transitionend', transitionendHandler);
                    document.body.removeChild(this);
                }
            }, false);

            // Delaying initial opacity change
            requestAnimationFrame(function () {
                // document.body.removeChild(div);
                div.style['opacity'] = targetOpacity;
            });
        }

        chrome.extension.onMessage.addListener(function (message, sender, callback) {

            switch (message.type) {
                case 'getMedia':
                    getMedia(callback);
                    break;
                case 'popupSaveDialog':
                    popupSaveDialog(message.data, callback);
                    break;
                case 'showResolution':
                    showResolution(message.data, callback);
                    break;

            }

        });

    })();

}