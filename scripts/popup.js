var App = function () {};
App.prototype = {

    tab: null,

    mediaQueries: null,

    breakpoints: null,

    execute: function () {
        var that = this;

        // Initializing mediaQueries array
        this.mediaQueries = [];

        // Initializing breakpoints map
        this.breakpoints = {};

        chrome.tabs.getSelected(null, function (tab) {

            // Active tab
            that.tab = tab;

            // Executing content script
            chrome.tabs.executeScript(tab.id, {
                file: "scripts/content.js"
            }, function () {
                // Can send getMedia message now
                chrome.tabs.sendMessage(tab.id, {
                    'type': 'getMedia'
                }, function (media) {
                    if (media) {
                        that.parseMedia.call(that, media);
                    } else {
                        console.log('Something went wrong, no media queries info was found!');
                    }
                });
            });
        });

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

    addBreakpoints: function addBreakpoints($bar) {
        var that = this,
            mq = $bar.data('mq');

        function addBreakpoint(val) {
            if (val) {
                var bmqs = that.breakpoints[val];
                (!bmqs && (that.breakpoints[val] = bmqs = []));
                (bmqs.indexOf($bar) == -1 && bmqs.push($bar));
            }
        }
        // Adding min breakpoint
        addBreakpoint(mq.minWidthValuePx);
        // Adding max breakpoint
        addBreakpoint(mq.maxWidthValuePx);
    },

    showResults: function showResults() {

        var maxValue = 0;

        if (this.mediaQueries.length == 1) {
            maxValue = Math.max(this.mediaQueries[0].minWidthValuePx ? this.mediaQueries[0].minWidthValuePx : 0,
                this.mediaQueries[0].maxWidthValuePx ? this.mediaQueries[0].maxWidthValuePx : 0);

        } else if (this.mediaQueries.length > 1) {

            // Sorting mediaQueries first
            this.mediaQueries.sort(function (a, b) {

                console.log(a.mediaText);

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

        }

        // Adding 16% to maxValue
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

            // Adding breakpoints
            this.addBreakpoints($item);

            // Adding item to an array
            items.push($item[0]);
        }

        // Appending items and registering click event
        $('#lst-media-queries').append(items)
            .on('click', '.media-query-bar', this.mediaQueryBar_clickHandler)
            .on('click', '.btn-open-css', this.styleSheetOpen_clickHandler);

    },

    drawRuler: function drawRuler(maxValue) {
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

    $widthMarker: null,
    $widthMarkerLabel: null,
    showWidthMarker: false,
    prevRulerPageX: null,

    ruler_mouseEnterHandler: function ruler_mouseEnterHandler(event) {
        var that = event.data.that;

        if (!that.$widthMarker) {
            that.$widthMarker = $('<div class="width-marker"><img src="images/ico-camera.png"/><span/></div>');
            that.$widthMarkerLabel = that.$widthMarker.find('span');
            that.$widthMarker.mouseenter({
                that: that
            }, that.widthMarker_mouseEnterHandler);
            that.$widthMarker.mouseleave({
                that: that
            }, that.widthMarker_mouseLeaveHandler);
            that.$widthMarker.click({
                that: that
            }, that.widthMarker_clickHandler);
        }
        that.showWidthMarker = true;
        that.$widthMarker.css('left', event.pageX - (that.$widthMarker.width() / 2)).appendTo(document.body).fadeIn('fast');

        // Setting initial page x
        that.prevRulerPageX = event.pageX;
    },

    ruler_mouseLeaveHandler: function ruler_mouseLeaveHandler(event) {
        var that = event.data.that;
        that.hideWidthMarker(that);
    },

    ruler_mouseMoveHandler: function ruler_mouseMoveHandler(event) {
        var that = event.data.that,
            // Ruler DOM element
            $ruler = $(this),
            // Ruler left position
            rulerLeft = $ruler.offset().left,
            // Ruler max value
            maxValue = event.data.maxValue,
            // Current value based on mouse pageX position
            currentValue = Math.round((event.pageX - rulerLeft) / $ruler.width() * maxValue),
            // Direction in which mouse was moved
            moveDirection = event.pageX - that.prevRulerPageX < 0 ? -1 : 1;

        /**
         * Internal function to find snapping point
         */
        function findSnapPoint(from, direction, twoWay) {
            var at = from,
                result = null;
            for (var i = 0; i < 10; i++) {
                var bps;
                if (bps = that.breakpoints[at]) {
                    result = {
                        at: at,
                        breakpoints: bps
                    };
                    break;
                }
                at = at + direction;
            }

            if (twoWay && !result)
                result = findSnapPoint(from, direction * -1, false);

            return result;
        }

        // Looking for snapping point
        var snapPoint = findSnapPoint(currentValue, moveDirection, true);
        // If snap poit found setting current value to it
        (snapPoint && (currentValue = snapPoint.at));

        // Positioning marker
        that.$widthMarkerLabel.html(currentValue + 'px');
        // Binding current value with width marker
        that.$widthMarker.data('currentValue', currentValue)
        // ruler left + current position inside the ruler - half of the width of $widthMarker
        .css('left', rulerLeft + Math.round(currentValue / maxValue * $ruler.width()) - (that.$widthMarker.width() / 2));

        // Setting previous ruler page x
        that.prevRulerPageX = event.pageX;
    },

    widthMarker_mouseEnterHandler: function widthMarker_mouseEnterHandler(event) {
        var that = event.data.that;
        that.showWidthMarker = true;
    },

    widthMarker_mouseLeaveHandler: function widthMarker_mouseLeaveHandler(event) {
        var that = event.data.that;
        that.hideWidthMarker(that);
    },

    hideWidthMarker: function hideWidthMarker(that) {
        that.showWidthMarker = false;
        setTimeout(function () {
            if (!that.showWidthMarker)
                that.$widthMarker.fadeOut('fast', function () {
                    that.$widthMarker.detach();
                });
        }, 200);
    },

    widthMarker_clickHandler: function widthMarker_clickHandler(event) {
        var that = event.data.that,
            snapshotWidth = $(this).data('currentValue');

        that.hideWidthMarker(that);

        $('#snapshot').toggleClass('visible');

        // Snaphotter complete handler
        function onSnapshotterComplete(snapshotPath) {

            $('#snapshot').toggleClass('visible');

            if (snapshotPath) window.open(snapshotPath);

        }

        // Taking whole page snapshot
        (new Snapshotter(that.tab, snapshotWidth, onSnapshotterComplete)).execute();

    }
};
(new App).execute();