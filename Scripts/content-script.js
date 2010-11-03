function click () {
    var that = this;
    if (this.href.indexOf("zip") > 0) {
        chrome.extension.sendRequest({ type: "new", url: that.href });
        return false;
    }
};

document.getElementsByTagName("a").each(function () {
    this.onclick = click;
});

