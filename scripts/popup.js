var App = function () {};
App.prototype = {

    mediaQueries: null,

    BAR_COLORS: ['#be9ce8', '#7ba7e5', '#5eded5', '#adcf68', '#e0da71', '#efbb6d', '#ea917e', '#e08cd0'],

    tab: null,

    execute: function () {
        var that = this;

        chrome.tabs.getSelected(null, function (tab) {

            // Active tab
            that.tab = tab;

            chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

                if (message && message.type) {

                    switch (message.type) {
                        case 'media':
                            that.parseMedia.call(that, message.data);
                            break;

                        case 'snapshot':
                            that.saveSnapshot.call(that, message.data, 'png');
                            break;

                    }

                }

            });

            // Executing content script
            chrome.tabs.executeScript(tab.id, {
                file: "scripts/content.js"
            }, function () {
                //                chrome.tabs.sendMessage(tab.id, {
                //                    'type': 'getMedia'
                //                });
            });
        });

    },

    saveSnapshot: function (dataURI, mimetype) {

        $('<a id="snap" download="snapshot.png" href="' + dataURI + '">download</a>').appendTo(document.body).delay(1000).click();

        //
        //
        //        // convert base64 to raw binary data held in a string
        //        // doesn't handle URLEncoded DataURIs
        //        var byteString = atob(dataURI.split(',')[1]);
        //
        //        // separate out the mime component
        //        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        //
        //        // write the bytes of the string to an ArrayBuffer
        //        var ab = new ArrayBuffer(byteString.length);
        //        var ia = new Uint8Array(ab);
        //        for (var i = 0; i < byteString.length; i++) {
        //            ia[i] = byteString.charCodeAt(i);
        //        }
        //
        //        // create a blob for writing to a file
        //        var blob = new Blob([ab], {
        //            type: mimeString
        //        });
        //
        //        function errorHandler(error) {
        //            console.log('Saving file failed!');
        //        }
        //
        //        function onwriteend() {
        //            // open the file that now contains the blob
        //            window.open('filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/' + name);
        //        }
        //
        //        window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function (fs) {
        //            fs.root.getFile(name, {
        //                create: true
        //            }, function (fileEntry) {
        //                fileEntry.createWriter(function (fileWriter) {
        //                    fileWriter.onwriteend = onwriteend;
        //                    fileWriter.write(blob);
        //                }, errorHandler);
        //            }, errorHandler);
        //        }, errorHandler);

    },

    styleSheetOpen_clickHandler: function (event) {

        var mq = $(this).parent().data('mq');

        chrome.tabs.create({
            url: mq.url,
            active: true
        }, function (t) {
            console.log('opened');

            // Executing content script
            chrome.tabs.executeScript(t.id, {
                file: "scripts/content_style.js"
            });

        });

    },

    mediaQueryBar_clickHandler: function (event) {
        var mq = $(this).parent().data('mq');

        chrome.windows.getCurrent(function (currentWindow) {

            var width;

            if (mq.minWidthValuePx == undefined)
                width = mq.maxWidthValuePx;
            else if (mq.maxWidthValuePx == undefined)
                width = mq.minWidthValuePx;
            else
                width = mq.minWidthValuePx + (mq.maxWidthValuePx - mq.minWidthValuePx) / 2;

            width = Math.round(width);

            chrome.windows.update(currentWindow.id, {
                width: width
            });
        });

    },

    parseMedia: function parseMedia(media) {

        // Initializing mediaQueries array
        this.mediaQueries = [];

        // Counter of external CSSs to parse
        this.externalCSSsToParse = 0;

        for (var i in media) {
            var m = media[i];

            if (m.media) {
                this.mediaQueries.push.apply(this.mediaQueries, this.parseMediaQueries(m.media.mediaText, m.url));
            } else {
                this.parseExternalCSS(m.url);
            }

        }

        if (this.externalCSSsToParse == 0)
            this.showResults();
    },

    parseMediaQueries: function parseMediaQueries(mediaText, url) {

        var results = [],
            queries = mediaText.split(',');

        for (var j in queries) {

            // Splitting separate media queries
            var queryText = $.trim(queries[j]);

            // Tokenizing width declarations
            var widths = queryText.match(/(min-width|min-device-width|max-width|max-device-width)|\d+\.?\d*|(px|em)/gi);

            if (widths && widths.length % 3 == 0) {

                var query = {
                    url: url,
                    mediaText: queryText
                };

                for (var i = 0; i < widths.length / 3; i++) {

                    var minmax = widths[i * 3].indexOf('min') >= 0 ? 'min' : 'max';

                    query[minmax + 'WidthName'] = widths[i * 3];
                    query[minmax + 'WidthValue'] = Number(widths[i * 3 + 1]);
                    query[minmax + 'WidthUnit'] = String(widths[i * 3 + 2]).toLowerCase();
                    query[minmax + 'WidthValuePx'] = query[minmax + 'WidthUnit'] == 'px' ? query[minmax + 'WidthValue'] : query[minmax + 'WidthValue'] * 16;

                }

                // Adding query to results
                results.push(query);
            } else {
                console.log('Couldn\'t find width expressions in:', queryText, 'from:', url);
            }

        }

        return results;
    },

    parseExternalCSS: function parseExternalCSS(url) {
        var that = this;

        // Incrementing counter value
        this.externalCSSsToParse++;

        function processResult(data) {
            if (data) {
                var mqs = data.match(/@media[\s\S]*?\{/gim);

                for (var i in mqs) {

                    var mediaText = mqs[i].substring(6, mqs[i].length - 1);

                    // Filtering only unique queries
                    var uniqueQueries = that.parseMediaQueries(mediaText, url).filter(function (mq) {
                        return !that.mediaQueries.some(function (mq1) {
                            return mq.url == mq1.url && mq.mediaText == mq1.mediaText;
                        });
                    });

                    // Adding parsed media queries
                    that.mediaQueries.push.apply(that.mediaQueries, uniqueQueries);

                }
            }
        }

        $.ajax(url, {
            dataType: 'text',
            success: processResult,

            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Error fetching css:', errorThrown);

                // Workaround for file:// loading
                if (url.indexOf('file://') == 0) {
                    processResult(jqXHR.responseText);
                }

            },

            complete: function () {
                that.externalCSSsToParse--;
                if (that.externalCSSsToParse == 0)
                    that.showResults();
            }
        });

    },

    showResults: function showResults() {

        var maxValue = 0;

        // Sorting mediaQueries first
        this.mediaQueries.sort(function (a, b) {

            var aMin = a.minWidthValuePx != undefined ? a.minWidthValuePx : null,
                aMax = a.maxWidthValuePx != undefined ? a.maxWidthValuePx : null,
                bMin = b.minWidthValuePx != undefined ? b.minWidthValuePx : null,
                bMax = b.maxWidthValuePx != undefined ? b.maxWidthValuePx : null,
                max = Math.max(aMin, aMax, bMin, bMax);

            // Setting max value
            if (max > maxValue) maxValue = max;

            if (aMin == null) {

                if (bMin == null)
                    return aMax - bMax;
                else // bMin != undefined
                    return -1;

            } else { // aMin != undefined

                if (bMin == null) {
                    return 1;
                } else { // bMin != undefined

                    if (aMax == null && bMax == null) {
                        return aMin - bMin;
                    } else if (aMax != null && bMax != null) {
                        return aMin - bMin;
                    } else if (aMax == null && bMax != null) {
                        return 1;
                    } else if (aMax != null && bMax == null) {
                        return -1;
                    }

                }
            }

            return 0;
        });

        // Adding 10% to maxValue
        maxValue = Math.round(maxValue * 1.16);

        // Drawing ruler
        this.drawRuler(maxValue);

        var topColors = chroma.color('#eda221'),
            midColors = chroma.color('#00FF00'),
            bottomColors = chroma.color('#0000FF');

        var items = [];
        for (var i in this.mediaQueries) {

            var mq = this.mediaQueries[i],

                barColor = null,

                barLeft = mq.minWidthValuePx == undefined ? 0 : mq.minWidthValuePx / maxValue * 100,

                barRight = mq.maxWidthValuePx == undefined ? 0 : (maxValue - mq.maxWidthValuePx) / maxValue * 100,

                $item = $('<li><div class="btn-open-css"/></li>').attr('title', 'mediaText: ' + mq.mediaText + '\n\nurl:' + mq.url);

            if (mq.minWidthValuePx == undefined) {
                barColor = topColors.hex();
                topColors = topColors.darken(-4);
            } else if (mq.maxWidthValuePx == undefined) {
                barColor = bottomColors.hex();
                bottomColors = bottomColors.darken(-4);
            } else {
                barColor = midColors.hex();
                midColors = midColors.darken(-4);
            }

            $('<div class="media-query-bar"/>').prependTo($item).css({
                left: barLeft + '%',
                right: barRight + '%',
                'background-color': barColor
            });

            if (mq.minWidthValuePx)
                $('<span class="bar-min-label"/>').prependTo($item).css('right', (100 - barLeft) + '%').html('MIN<br/>' + mq.minWidthValue + mq.minWidthUnit);

            if (mq.maxWidthValuePx)
                $('<span class="bar-max-label"/>').prependTo($item).css('left', (100 - barRight) + '%').html('MAX<br/>' + mq.maxWidthValue + mq.maxWidthUnit);

            // Attaching mq to DOM element
            $item.data('mq', mq);

            // Adding item to an array
            items.push($item[0]);
        }

        // Appending items and registering click event
        $('#lst-media-queries').append(items)
            .on('click', '.media-query-bar', this.mediaQueryBar_clickHandler)
            .on('click', '.btn-open-css', this.styleSheetOpen_clickHandler);

    },

    drawRuler: function (maxValue) {
        var $ruler = $('#media-queries-ruler'),
            SEGMENT_PX = 250,
            segmentWidth = SEGMENT_PX / maxValue * 100,
            segments = [];

        for (var i = 0; i < Math.ceil(maxValue / SEGMENT_PX); i++) {
            segments.push('<div class="ruler-segment" style="width:' + segmentWidth + '%' + '">' + (i * SEGMENT_PX) + 'px</div>');
        }

        $ruler.html(segments);

        $ruler.mouseenter({
            that: this
        }, this.ruler_mouseEnterHandler);
        $ruler.mousemove({
            that: this,
            maxValue: maxValue,
            SEGMENT_PX: SEGMENT_PX
        }, this.ruler_mouseMoveHandler);
        $ruler.mouseleave({
            that: this
        }, this.ruler_mouseLeaveHandler);
    },

    $snapshot: null,
    showSnapshot: false,

    ruler_mouseEnterHandler: function (event) {
        var that = event.data.that;

        if (!that.$snapshot) {
            that.$snapshot = $('<div class="snapshot"></div>');
            that.$snapshot.mouseenter({
                that: that
            }, that.snapshot_mouseEnterHandler);
            that.$snapshot.mouseleave({
                that: that
            }, that.snapshot_mouseLeaveHandler);
            that.$snapshot.click({
                that: that
            }, that.snapshot_clickHandler);
        }

        that.showSnapshot = true;
        that.$snapshot.css('left', event.pageX - 17).appendTo(document.body).fadeIn('fast');
    },

    ruler_mouseLeaveHandler: function (event) {
        var that = event.data.that;
        that.hideSnapshot(that);
    },

    ruler_mouseMoveHandler: function (event) {
        var that = event.data.that,
            $ruler = $(this),
            rulerOffset = $ruler.offset(),
            mouseX = event.pageX - rulerOffset.left,
            maxValue = event.data.maxValue
            currentValue = Math.round(mouseX / $ruler.width() * maxValue);

        that.$snapshot.html(currentValue + 'px')
            .data('currentValue', currentValue)
            .css('left', event.pageX - 17);
    },

    snapshot_mouseEnterHandler: function (event) {
        var that = event.data.that;
        that.showSnapshot = true;
    },

    snapshot_mouseLeaveHandler: function (event) {
        var that = event.data.that;
        that.hideSnapshot(that);
    },

    hideSnapshot: function (that) {
        that.showSnapshot = false;
        setTimeout(function () {
            if (!that.showSnapshot)
                that.$snapshot.fadeOut('fast', function () {
                    that.$snapshot.detach();
                });
        }, 200);
    },

    snapshot_clickHandler: function (event) {
        var that = event.data.that,
            snapshotWidth = $(this).data('currentValue');

        that.hideSnapshot(that);

        $('#snapshot').toggleClass('visible');

        chrome.windows.getCurrent(function (currentWindow) {

            var restoreWidth = currentWindow.width;

            chrome.windows.update(currentWindow.id, {
                width: snapshotWidth
            }, function () {

                // Snaphotter complete handler
                function onSnapshotterComplete(snapshotPath) {
                    chrome.windows.update(currentWindow.id, {
                        width: restoreWidth
                    }, function () {

                        $('#snapshot').toggleClass('visible');

                        if (snapshotPath) window.open(snapshotPath);

                    });
                }

                // Taking whole page snapshot
                (new Snapshotter(that.tab, onSnapshotterComplete)).execute();

            });

        });

    }
};
(new App).execute();

//    document.getElementById('btn-capture').onclick = function captureScreens() {
//
//        chrome.windows.create({
//            url: 'http://onet.pl',
//            width: 480,
//            height: 1024
//        }, function (newWindow) {
//
//            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
//                if (changeInfo.status === 'complete') {
//
//                    console.log('loading tab complete');
//
//                    chrome.tabs.captureVisibleTab(newWindow.id, function (dataUrl) {
//                        console.log(dataUrl);
//
//                        // http://stackoverflow.com/questions/6431281/save-png-canvas-image-to-html5-storage-javascript
//                    });
//
//                }
//            });
//
//        });
//
//    }