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
                    // Starting from top
                    that.scrollPage.call(that, true);
                }
            });
        });
    },

    scrollPage: function scrollPage(fromStart) {
        var that = this;

        chrome.tabs.sendMessage(that.tab.id, {
            type: 'scrollPage',
            data: {
                fromStart: fromStart
            }
        }, function (response) {

            if (response) {
                chrome.tabs.captureVisibleTab(
                    that.tab.windowId, {
                    format: 'png'
                }, function (dataURI) {
                    if (dataURI) {

                        // Creating new canvas if not exists yet
                        if (!that.canvas) {
                            that.canvas = document.createElement('canvas');
                            that.canvas.width = that.snapshotWidth;
                            that.canvas.height = response.pageHeight;
                            that.canvasCtx = that.canvas.getContext('2d');
                        }

                        // Checking if height didn't change
                        if (that.canvas.height != response.pageHeight) {
                            var newCanvas = document.createElement('canvas'),
                                newContext = newCanvas.getContext('2d');

                            newCanvas.width = that.snapshotWidth;
                            newCanvas.height = response.pageHeight;

                            // Drawing image on new canvas
                            newContext.drawImage(that.canvas, 0, 0);

                            // Updating canvas with new object with different height
                            that.canvas = newCanvas;
                            that.canvasCtx = newContext;
                        }

                        // Drawing current snapshot on canvas
                        that.drawOnCanvas.call(that, response, dataURI);
                    }
                });
            }
        });
    },

    drawOnCanvas: function drawOnCanvas(response, dataURI) {
        var that = this,
            image = new Image();

        image.onload = function () {

            // Drawing image on the canvas
            that.canvasCtx.drawImage(image, 0, response.currentY); //  * window.devicePixelRatio

            // Calculating next y position
            if ((response.currentY + response.viewHeight) < response.pageHeight) {

                // Recursive call to scrollPage
                that.scrollPage.call(that, false);

            } else {

                // Cleaning up
                chrome.tabs.sendMessage(that.tab.id, {
                    type: 'restore'
                }, function (response) {

                    if (that.initialWindowWidth < that.snapshotWidth) {
                        chrome.windows.update(that.currentWindow.id, {
                            width: that.initialWindowWidth
                        });
                    }

                });

                // Saving snapshot
                that.saveSnapshot.call(that, that.canvas.toDataURL());
            }
        };

        // Setting source of image object
        image.src = dataURI;
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
            type: 'image/png'
        }),

            // come up with a filename
            name = 'snapshot.png';

        function onwriteend() {
            // open the file that now contains the blob
            that.onUpdateCallback({
                status: 'complete',
                blob: blob,
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