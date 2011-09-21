String.prototype.toArrayBuffer = function(start,end) {
	start = start || 0;
	end = end || this.length;
	var length = end - start;
	var buffer = new ArrayBuffer(length),
	writeArray = new Uint8Array(buffer, 0, length);
	for(var i = 0; i < length; i++) {
		writeArray[i] = this.charCodeAt(start + i);
	}
	return buffer;
}
ArrayBuffer.prototype.toString = function(byteOffset,length) {
	var readArray = new Uint8Array(this,byteOffset,length),
		str = "";
	for(var i = 0; i < readArray.length; i++) {
		str += String.fromCharCode(readArray[i]);
	}
	return str;
}

const BYTE = 1;
const WORD = 2;
const DWORD = 4;
const LOAD_FORMAT = "text/plain;charset=x-user-defined";
const SAVE_FORMAT = "application/zip;charset=x-user-defined";


const ZipHeader = {
	signature: String.fromCharCode(80,75,05,06),
	length: 22,
	layout: {
		header:			{ offset:  0, length: DWORD },
		disk: 			{ offset:  4, length: WORD  },
		startDisk: 		{ offset:  6, length: WORD  },
		records: 		{ offset:  8, length: WORD  },
		totalRecords: 	{ offset: 10, length: WORD  },
		cdSize: 		{ offset: 12, length: DWORD },
		startOffset: 	{ offset: 16, length: DWORD }
	}
};
const FileHeader = {
	signature: String.fromCharCode(80,75,01,02),
	length: 46,
	layout: {
		header:				{ offset: 0,  length: DWORD },
		madeVersion: 		{ offset: 4,  length: WORD  },
		extractVersion: 	{ offset: 6,  length: WORD  },
		bitFlag: 			{ offset: 8,  length: WORD  },
		compressionMethod: 	{ offset: 10, length: WORD  },
		lastModTime: 		{ offset: 12, length: WORD  },
		lastModDate: 		{ offset: 14, length: WORD  },
		crc: 				{ offset: 16, length: DWORD },
		compressedSize: 	{ offset: 20, length: DWORD },
		unCompressedSize: 	{ offset: 24, length: DWORD },
		fileNameLength: 	{ offset: 28, length: WORD  },
		extraFieldLength: 	{ offset: 30, length: WORD  },
		commentFieldLength: { offset: 32, length: WORD  },
		disk: 				{ offset: 34, length: WORD  },
		internalAttributes: { offset: 36, length: WORD  },
		externalAttributes: { offset: 38, length: DWORD },
		fileOffset: 		{ offset: 42, length: DWORD },
	}
}
const LocalFileHeader = {
	signature: String.fromCharCode(80,75,03,04),
	length: 30,
	layout: {
		header:				{ offset:  0, length: DWORD },
		extractVersion: 	{ offset:  4, length: WORD  },
		bitFlag: 			{ offset:  6, length: WORD  },
		compressionMethod: 	{ offset:  8, length: WORD  },
		lastModTime: 		{ offset: 10, length: WORD  },
		lastModDate: 		{ offset: 12, length: WORD  },
		crc: 				{ offset: 14, length: DWORD },
		compressedSize: 	{ offset: 18, length: DWORD },
		unCompressedSize: 	{ offset: 22, length: DWORD },
		fileNameLength: 	{ offset: 26, length: WORD  },
		extraFieldLength: 	{ offset: 28, length: WORD  }
	}
}


function Header(data,type) {
	var header = {};
	header.buffer = data ? data.toArrayBuffer(0,type.length) : new ArrayBuffer(type.length);
	header.dataView= new DataView(header.buffer);
	
	for(var i in type.layout) {
		header[i] = type.layout[i].length === WORD ? 
			   header.dataView.getUint16(type.layout[i].offset,true): 
			   header.dataView.getUint32(type.layout[i].offset,true);
		header["set" + i] = (function() {
				var index = i;
			return type.layout[i].length === WORD ? 
				function(newValue) { header.dataView.setUint16(type.layout[index].offset,(header[index] = newValue),true) } :
				function(newValue) { header.dataView.setUint32(type.layout[index].offset,(header[index] = newValue),true) };
		})();
	}
	return header;
}

function LocalFileHeaderReader(data){
	return new Header(data,LocalZipHeader);
};
function FileHeaderReader(data) {
	var header = new Header(data,FileHeader);
	header.headerLength = FileHeader.length + header.fileNameLength;
	header.fileName = data.substr(FileHeader.length,header.fileNameLength);
	return header;
};
function ZipHeaderReader(data){
	return new Header(data,ZipHeader);
};


function ZipFile(params) {
	var zipFile = this;
    this.url = params.url;
	this.files = [];
    this.header = null;
    var fileSize = null;
    this.status = DownloadStatus.notInitialised;
    this.filename = window.unescape(zipFile.url.split("/").pop());
	this.getProgress = function(){
		return {
			current: 0,
			total: 0
		}
	};

    //callbacks
	this.oninfoload = params.oninfoload || null;//when all the information about the zipfile is recieved
    this.onfileload = params.onfileload || null;//when the file is downloaded

    var getFileSize = function (callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            switch (request.readyState) {
                case 2: // Headers Recieved
                    if (request.status == 200) {
                        fileSize = parseInt(request.getResponseHeader("Content-Length"));
                        request.abort(); //stop now that we have got our headers
                        if (isNaN(fileSize) || fileSize === null) {
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
        request.open("GET", zipFile.url, true);
        request.send();
    };


    var downloadDataSegment = function (callback, rangeStart, rangeEnd, onprogress) {
        var args = arguments;
        var request = new XMLHttpRequest();
        request.overrideMimeType('text/plain; charset=x-user-defined');
		onprogress && (request.onprogress = onprogress);
		
		request.onreadystatechange = function () {
            switch (request.readyState) {
                case 1:
                    request.setRequestHeader("Range", "bytes=" + (rangeStart) + "-" + (rangeEnd));
                    break;
                case 4: // Completed
				callback(request.responseText);
				break;
            }
        };
        request.open("GET", zipFile.url, true);
        request.send();
        return request;
    };
	
    var beginDownload = function () {
        //600 is a safe bet to include the end of central directory record
        //we just get the end of central directory record because from here we can find the locations of centraldirectory
        //headers which store all the information we need
        downloadDataSegment(getHeader, fileSize - 600, fileSize);
    };
	
    var getHeader = function (data) {
        var offset = data.lastIndexOf(ZipHeader.signature);
        if (offset > -1) {
			zipFile.header = new ZipHeaderReader(data.substr(offset));
            downloadDataSegment(readFileHeaders, zipFile.header.startOffset, fileSize);
        }
    };

    var readFileHeaders = function (data) {
        //support for files such as crx which use the zip file structure but have
        //data prepended at the start. This upsets the offsets stored in the headers
        //so we have to account for that and search for the first header.
        var errorOffset = data.indexOf(FileHeader.signature);
        var offset = errorOffset;
		var offset2 = data.indexOf(FileHeader.signature,offset + 1);
        for (var i = 0; i < zipFile.header.totalRecords; i++) {

			zipFile.files.push(new FileHeaderReader(data.substring(offset,offset2)));
			
            zipFile.files[i].setfileOffset(zipFile.files[i].fileOffset + errorOffset);
			offset = offset2;
			offset2 = data.indexOf(FileHeader.signature,offset + 1);
			offset2 = offset2 <= 0 ? data.length : offset2;
        }
        for (var i = 1; i < zipFile.header.totalRecords; i++) {
            zipFile.files[i - 1].endFile = zipFile.files[i].fileOffset - 1;
        }
        zipFile.files[zipFile.header.totalRecords - 1].endFile = zipFile.header.startOffset - 1;
        zipFile.oninfoload && zipFile.oninfoload();
    };

    this.downloadFiles = function (fileList) {
		var fs = [];
		for(var i = 0; i < fileList.length;i++) {
			fs.push(zipFile.files[fileList[i]]);
		}
		
		var zipBuilder = new BlobBuilder();
		var fileIndex = 0;
		
		
		var nextFile = function(blob) {
			zipFile.onfileload && zipFile.onfileload(fileList[fileIndex]);
			fs[fileIndex].setfileOffset(zipBuilder.getBlob().size);
			zipBuilder.append(blob.toArrayBuffer());

			if(fileIndex == fs.length - 1) {
				writeEndFile();
				return;
			}
			fileIndex++;
			downloadFile(fs[fileIndex],nextFile);
		};
		var writeEndFile = function() {
			zipFile.header.setstartOffset(zipBuilder.getBlob().size);
			
			for(var i = 0; i < fs.length; i++) {
				zipBuilder.append(fs[i].buffer);
				zipBuilder.append(fs[i].fileName);
			}
			zipFile.header.setrecords(fs.length);
			zipFile.header.settotalRecords(fs.length);
			zipFile.header.setcdSize(zipBuilder.getBlob().size - zipFile.header.startOffset);
			
			zipBuilder.append(zipFile.header.buffer);
			
			var blob = zipBuilder.getBlob("application/zip;charset=x-user-defined"); 
			window.open(window.webkitURL.createObjectURL(blob),zipFile.filename);
		}

		downloadFile(fs[fileIndex],nextFile);
    };
			
	var downloadFile = function(file,callback){
		downloadDataSegment(callback,file.fileOffset,file.endFile)
	};

    //we begin by getting the file size
    getFileSize(beginDownload);	
}