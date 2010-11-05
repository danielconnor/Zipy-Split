var ZipySplit = function (plugin) {
    var zipySplit = this;
    this.zipFiles = {};

    this.defaultSettings = {
        run: true
    };

    this.loadSettings = function () {
        if (!localStorage["run"]) {
            for (var setting in zipySplit.defaultSettings) {
                localStorage[setting] = zipySplit.defaultSettings[setting];
            }
        }
    };

    var onComplete = function () {
        var that = this;
        var notification = webkitNotifications.createNotification(
                "Images/zipysplit_48.png",  // icon url - can be relative
                "Download Complete",  // notification title
                that.url  // notification body text
            );
        notification.show();
        setTimeout(function () {
            notification.cancel();
        }, 2000);
    };

    this.openFileViewer = function (zipUrl) {
        chrome.tabs.create({ url: "file-viewer.html" }, function (tab) {
            if (!zipySplit.zipFiles[zipUrl]) {
                zipySplit.zipFiles[zipUrl] = new ZipFile({
                    url: zipUrl,
                    plugin: plugin,
                    onInfoLoad: function () {
                        chrome.tabs.sendRequest(tab.id, { type: "new", file: this });
                    },
                    onLoad: function () {
                    },
                    onComplete: onComplete
                });
            }
        });
    };

    this.download = function (fileList, url) {
        zipySplit.zipFiles[url].downloadFiles(fileList, plugin);
    };

    this.contextMenu = chrome.contextMenus.create(
        {
            title: "Open with zipy split",
            contexts: ["link"],
            onclick: function (e) {
                zipySplit.openFileViewer(e.linkUrl);
            }
        }, function () {
            if (chrome.extension.lastError) {
                console.log("Got expected error: " + chrome.extension.lastError.message);
            }
        });

    this.plugin = plugin;
    this.plugin.setErrorFunc("alert");
    this.loadSettings();
};