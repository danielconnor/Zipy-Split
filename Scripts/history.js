ZipHistory = function (errorFunc) {
    this.db = prepareDatabase();
};
ZipHistory.prototype.prepareDatabase = function(ready, error) {
    return openDatabase('downloads', '1.0', 'download history', 5 * 1024 * 1024, function (db) {
        db.changeVersion('', '1.0', function (t) {
            t.executeSql('CREATE TABLE history (id, url, date, status)');
        }, this.errorFunc || null);
    });
};
ZipHistory.prototype.executeSql = function (query,callback) {
    this.db.readTransaction(function (t) {
        t.executeSql(query,[], callback);
    });
}

ZipHistory.prototype.getCount = function (callback) {
    this.executeSql("SELECT COUNT(*) AS c FROM docids",[], callback);
}
ZipHistory.prototype.getDownload = function (id, callback) {
    this.executeSql("SELECT title, author FROM docs WHERE id=?", [id], callback);
}
ZipHistory.prototype.addDownload = function (zipFile, callback) {
    this.executeSql('INSERT INTO foo (id, url, date) VALUES (?, ?)', [id, zipFile.url,new Date(),zipFile.status]);
}
