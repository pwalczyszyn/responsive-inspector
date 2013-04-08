var Snapshotter = function (tab, snapshotWidth, onUpdateCallback) {
    this.tab = tab;
    this.snapshotWidth = snapshotWidth;
    this.onUpdateCallback = onUpdateCallback;
    this.currentY = 0;
}

Snapshotter.prototype = {

    tab: null,

    onUpdateCallback: null,

    snapshotWidth: null,

    initialWindowWidth: null,

    currentWindow: null,

    viewHeight: null,

    pageHeight: null,

    currentY: null,

    canvas: null,

    canvasCtx: null,

    execute: function execute() {
        var that = this;

        chrome.windows.getCurrent(function (currentWindow) {

            that.currentWindow = currentWindow;
            that.initialWindowWidth = currentWindow.width;

            if (that.initialWindowWidth < that.snapshotWidth) {

                chrome.windows.update(currentWindow.id, {
                    width: that.snapshotWidth
                }, function () {
                    that.loadContentScript.call(that);
                });

            } else {
                that.loadContentScript.call(that);
            }

        });
    },

    loadContentScript: function loadContentScript() {
        var that = this;

        chrome.tabs.executeScript(that.tab.id, {
            file: "scripts/content_snapshot.js"
        }, function () {

            chrome.tabs.sendMessage(that.tab.id, {
                type: 'loadIFrame',
                data: {
                    snapshotWidth: that.snapshotWidth
                }
            }, function (response) {

                if (response) {

                    that.viewHeight = response.viewHeight;
                    that.pageHeight = response.pageHeight;

                    // Starting from top
                    that.scrollPage.call(that, that.currentY);

                }

            });
        });
    },

    scrollPage: function scrollPage(y) {
        var that = this;

        chrome.tabs.sendMessage(that.tab.id, {
            type: 'scrollPage',
            data: {
                'y': y
            }
        }, function (response) {

            if (response) {

                console.log('Taking screen shot at:', that.currentY);

                chrome.tabs.captureVisibleTab(
                    that.tab.windowId, {
                    format: 'jpeg',
                    quality: 100
                }, function (dataURI) {
                    if (dataURI) {

                        if (!that.canvas) {
                            that.canvas = document.createElement('canvas');
                            that.canvas.width = that.snapshotWidth;
                            that.canvas.height = that.pageHeight;
                            that.canvasCtx = that.canvas.getContext('2d');
                        }

                        var image = new Image();
                        image.onload = function () {

                            // Drawing image on the canvas
                            that.canvasCtx.drawImage(image, 0, that.currentY);

                            // Calculating next y position
                            var nextY = that.currentY + that.viewHeight;

                            if (nextY != that.pageHeight && (nextY + that.viewHeight) > that.pageHeight)
                                nextY = that.pageHeight - that.viewHeight;

                            if (nextY < that.pageHeight) {

                                that.currentY = nextY;

                                // Recursive call to scrollPage
                                that.scrollPage.call(that, nextY, that.tab);

                            } else {

                                // Cleaning up
                                chrome.tabs.sendMessage(that.tab.id, {
                                    type: 'restore'
                                }, function (response) {

                                    if (that.initialWindowWidth < that.snapshotWidth) {
                                        chrome.windows.update(that.currentWindow.id, {
                                            width: that.initialWindowWidth
                                        }, function () {});
                                    }

                                });

                                // Saving snapshot
                                that.saveSnapshot.call(that, that.canvas.toDataURL());

                            }
                        };

                        // Setting source of image object
                        image.src = dataURI;

                    }
                });
            }
        });
    },

    saveSnapshot: function saveSnapshot(dataURI) {
        var that = this,
            binary = atob(dataURI.split(',')[1]),
            array = [];

        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }

        // New Blob with stitched snapshots
        var blob = new Blob([new Uint8Array(array)], {
            type: 'image/jpeg'
        }),

            // come up with a filename
            name = 'snapshot-' + that.snapshotWidth + 'x' + that.pageHeight + '.jpg';

        function onwriteend() {
            // open the file that now contains the blob
            that.onUpdateCallback({
                status: 'complete',
                path: 'filesystem:chrome-extension://' + chrome.i18n.getMessage("@@extension_id") + '/temporary/' + name
            });
        }

        function errorHandler(error) {
            that.onUpdateCallback({
                status: 'error',
                error: error
            });
        }

        // create a blob for writing to a file
        window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function (fs) {
            fs.root.getFile(name, {
                create: true
            }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = onwriteend;
                    fileWriter.write(blob);
                }, errorHandler);
            }, errorHandler);
        }, errorHandler);
    }

}