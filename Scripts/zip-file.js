var source = "zip-file.js"; // for error handling

//signatures
var EOCD = ['50', '4b', '01', '02']; //end of central directory
var LFH = ['50', '4b', '03', '04']; //local header
var CDFH = ['50', '4b', '05', '06']; //central directory file header

var BYTE = 1;
var WORD = 2;
var DWORD = 4;

//end of central directory record
zipFileHeaderLayout = {
    disk: { offset: 4, length: WORD, type: 'int' },
    startDisk: { offset: 6, length: WORD, type: 'int' },
    records: { offset: 8, length: WORD, type: 'int' },
    totalRecords: { offset: 10, length: WORD, type: 'int' },
    cdSize: { offset: 12, length: DWORD, type: 'int' },
    startOffset: { offset: 16, length: DWORD, type: 'int' },
    commentLength: { offset: 20, length: WORD, type: 'int' }
};

//central directory file header
//we don't need the local file header because all of the information is contained here

fileHeaderLayout = {
    madeVersion: { offset: 4, length: WORD, type: 'int' },
    extractVersion: { offset: 6, length: WORD, type: 'int' },
    bitFlag: { offset: 8, length: WORD, type: 'int' },
    compressionMethod: { offset: 10, length: WORD, type: 'int' },
    lastModTime: { offset: 12, length: WORD, type: 'int' },
    lastModDate: { offset: 14, length: WORD, type: 'int' },
    crc: { offset: 16, length: DWORD, type: 'int' },
    compressedSize: { offset: 20, length: DWORD, type: 'int' },
    unCompressedSize: { offset: 24, length: DWORD, type: 'int' },
    fileNameLength: { offset: 28, length: WORD, type: 'int' },
    extraFieldLength: { offset: 30, length: WORD, type: 'int' },
    commentFieldLength: { offset: 32, length: WORD, type: 'int' },
    disk: { offset: 34, length: WORD, type: 'int' },
    internalAttributes: { offset: 36, length: WORD, type: 'int' },
    externalAttributes: { offset: 38, length: DWORD, type: 'int' },
    fileOffset: { offset: 42, length: DWORD, type: 'int' },
    fileName: { offset: 46, length: 'fileNameLength', type: 'string' },
    extraField: { offset: 46, length: 'extraFieldLength', type: 'array', extraOffset: 'fileNameLength' }
};


function ZipFile(params) {
    var that = this;
    this.url = params.url;
    this.files = [];
    this.endCentralDirectory = null;
    this.fileSize = null;

    //callbacks
    this.onLoad = params.onLoad;
    this.onInfoLoad = params.onInfoLoad;
    this.onFileLoad = params.onFileLoad;
    this.onComplete = params.onComplete;

    this.status = DownloadStatus.notInitialised;
    this.filename = window.unescape(this.url.split("/").pop());


    this.getFileSize = function (callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            switch (request.readyState) {
                case 2: // Headers Recieved
                    if (request.status == 200) {
                        that.fileSize = parseInt(request.getResponseHeader("Content-Length"));
                        request.abort(); //stop now that we have got our headers
                        if (isNaN(that.fileSize) || that.fileSize === null) {
                            var error = "Server response did not contain Content-Length";
                        }
                        else {
                            callback();
                        }

                    }
                    else {
                        error("Error:" + request.status + " was given by the server");
                    }
                    break;
            }
        };

        //this should be a HEAD request but some servers seem to block them and give a 404
        //instead. So we do a GET and then stop when we get the headers.
        request.open("GET", that.url, true);
        request.send();
    };


    this.downloadDataSegment = function (callback, rangeStart, rangeEnd) {
        var args = arguments;
        var request = new XMLHttpRequest();
        request.overrideMimeType('text/plain; charset=x-user-defined');
        request.onreadystatechange = function () {
            switch (request.readyState) {
                case 1:
                    request.setRequestHeader("Range", "bytes=" + (rangeStart) + "-" + (rangeEnd));
                    break;
                case 4: // Completed
                    var data = "";
                    var temp = request.responseText;
                    delete request;
                    for (var i = 0; i < temp.length; i++) {
                        data += String.fromCharCode(temp.charCodeAt(i) & 0xff);
                    }
                    callback(data, args);
                    break;
            }
        };
        request.open("GET", that.url, true);
        request.send();
        return request;
    };

    this.getEndCentralDirectory = function (data) {
        data = convertData(data);
        var offset = lastIndexOf(data, CDFH);
        if (offset > -1) {
            that.endCentralDirectory = new zipFileHeader(offset, data);
            that.downloadDataSegment(that.getFileHeaders, that.endCentralDirectory.startOffset, that.fileSize);
        }
        else {
            //error("The content-length supplied by the server is wrong");
        }
    };

    this.getFileHeaders = function (data) {
        data = convertData(data);

        //support for files such as crx which use the zip file structure but have
        //data prepended at the start. This upsets the offsets stored in the headers
        //so we have to account for that and search for the first header.
        var errorOffset = indexOf(data, EOCD);
        var offset = errorOffset;
        for (var i = 0; i < that.endCentralDirectory.totalRecords; i++) {
            that.files[i] = new cdFileHeader(offset, data);
            that.files[i].fileOffset += errorOffset;
            offset += that.files[i].headerLength;
        }
        for (var i = 1; i < that.endCentralDirectory.totalRecords; i++) {
            that.files[i - 1].endFile = that.files[i].fileOffset - 1;
        }
        that.files[that.endCentralDirectory.totalRecords - 1].endFile = that.endCentralDirectory.startOffset - 1;
        if (that.onInfoLoad) {
            that.onInfoLoad();
            that.downloadId = plugin.setupDownload(that.url,
                                                localStorage["save_loc"] + that.filename,
                                                that.endCentralDirectory,
                                                that);
        }
    };

    this.beginDownload = function () {
        //600 is a safe bet to include the end of central directory record
        //we just get the end of central directory record because from here we can find the locations of centraldirectory
        //headers which store all the information we need
        that.downloadDataSegment(that.getEndCentralDirectory, that.fileSize - 600, that.fileSize);
    };


    this.downloadFiles = function (fileList, plugin) {
        if (fileList.length > 0) {
            var files = [];
            var curFile;
            for (var i = 0; i < fileList.length; i++) {
                curFile = that.files[fileList[i]];
                files.push(curFile);
            }
            plugin.beginDownload(that.downloadId, files);
            that.status = DownloadStatus.downloading;
        }
    };
    this.getProgress = function (plugin) {
        return plugin.getDownloadProgress(that.downloadId);
    };
    this.pauseDownload = function (plugin) {
        that.status = DownloadStatus.paused;
        return plugin.pauseDownload(that.downloadId);
    };
    this.resumeDownload = function (plugin) {
        that.status = DownloadStatus.downloading;
        return plugin.resumeDownload(that.downloadId);
    };
    this.complete = function () {
        that.status = DownloadStatus.finished;
        if (that.onComplete) {
            that.onComplete();
        }
    };

    //we begin by getting the file size
    this.getFileSize(that.beginDownload);
}

function zipFileHeader(offset, data) {
    for (var p in zipFileHeaderLayout) {
        this[p] = parseInt(littleToBigEndian(offset + zipFileHeaderLayout[p].offset, zipFileHeaderLayout[p].length, data), 16);
    }
};

function cdFileHeader(offset, data) {
    for (var p in fileHeaderLayout) {
        switch (fileHeaderLayout[p].type) {
            case 'int':
                this[p] = parseInt(littleToBigEndian(offset + fileHeaderLayout[p].offset, fileHeaderLayout[p].length, data), 16) | 0;
                break;
            case 'string':
                this[p] = '';
                var curOffset = offset + fileHeaderLayout[p].offset + (fileHeaderLayout[p].extraOffset ? this[fileHeaderLayout[p].extraOffset] : 0);
                for (var i = curOffset; i < curOffset + (typeof fileHeaderLayout[p].length == "number" ? fileHeaderLayout[p].length : this[fileHeaderLayout[p].length]); i++) {
                    this[p] += String.fromCharCode(parseInt(data[i], 16));
                }
                break;
            case 'array':
                this[p] = [];
                var curOffset = offset + fileHeaderLayout[p].offset + (fileHeaderLayout[p].extraOffset ? this[fileHeaderLayout[p].extraOffset] : 0);
                for (var i = curOffset; i < curOffset + (typeof fileHeaderLayout[p].length == "number" ? fileHeaderLayout[p].length : this[fileHeaderLayout[p].length]); i++) {
                    this[p].push(parseInt(data[i], 16));
                }
                break;
        }

    }
    this.headerLength = 46 + this.fileNameLength + this.extraFieldLength + this.commentFieldLength;
    this.ToString = function () {
        var s = '';
        for (var z in this) {
            s += z + ":" + this[z] + "\n";
        }
        return s;
    }
};