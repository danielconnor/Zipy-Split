function ZipySplit() {
    var zipySplit = this;
    this.zipFiles = {};
    if(!localStorage.hasRun) {
		localStorage.hasRun = true;
		this.loadDefaultSettings();
		window.open("intro.html");
	}
	else {

	}
	this.contextMenu = chrome.contextMenus.create(
    {
        title: "Open with zipy split",
        contexts: ["link"],
        onclick: function (e) {
            zipySplit.openFileViewer(e.linkUrl);
        }
    }, function () {
        if (chrome.extension.lastError) {
            console.log("Got unexpected error: " + chrome.extension.lastError.message);
        }
    });
};

ZipySplit.prototype.loadDefaultSettings = function () {
    for (var i in DefaultSettings) {
        localStorage[i] = DefaultSettings[i].def;
    }
};
ZipySplit.prototype.onComplete = function (url) {
    var notification = webkitNotifications.createNotification(
            "Images/zipysplit_48.png",
            "Download Complete",
            url
        );
    notification.show();
    setTimeout(function () {
        notification.cancel();
    }, 2000);
};
ZipySplit.prototype.openFileViewer = function (zipUrl, demo) {
    var zipySplit = this;
    chrome.tabs.create({ url: "file-viewer.html" }, function (tab) {
        zipySplit.zipFiles[zipUrl] = new ZipFile({
            url: zipUrl,
            oninfoload: function () {
                chrome.tabs.sendRequest(tab.id, { type: "new", file: this });
            },
            onfileload: function (fileIndex) {
                chrome.tabs.sendRequest(tab.id, { type: "fileLoad", fileIndex: fileIndex });
            }
        });
    });
};
ZipySplit.prototype.download = function (fileList, url) {
    zipySplit.zipFiles[url].downloadFiles(fileList);
};
