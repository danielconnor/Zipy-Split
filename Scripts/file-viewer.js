var source = "zip-file.js"; // for error handling

//file browser for browsing zip files
function fileBrowser(file, onDownload,callback) {
    var that = this;
    var contentSuffix = "~contents";
    this.currentFolder = '/';
    this.onDownload = onDownload;
    var rootFolder = this.currentFolder + contentSuffix;
    this.filesToDownload = [];
    this.history = [];
    this.file = file;
    this.generateFileStructure = function () {
        for (i in file.files) {
            var fileName = file.files[i].fileName.split('/');
            var currentFolderName = '/';
            for (var p in fileName) {
                //fileName[p].length > 0 - need to check this because the path 
                //has '/' at start and end so split will return empty strings
                if (fileName[p].length > 0 && document.getElementById(fileName[p]) === null) {
                    var type, extension, name, parent, currentFile, contents;
                    if (p == 0) {
                        parent = document.getElementById(rootFolder);
                    }
                    else {
                        parent = document.getElementById(currentFolderName + contentSuffix);
                    }
                    currentFile = document.createElement('div');
                    if (p == fileName.length - 1 && file.files[i].fileName[file.files[i].fileName.length -1] != '/') {
                        currentFile.id = currentFolderName + fileName[p];
                        type = 'file';
                        var dot = fileName[p].lastIndexOf('.');
                        extension = dot > 0 ? fileName[p].substr(dot + 1) : '<br/>';
                        extension = extension.length > 5 ? extension.substr(0, 3) + '...' : extension;
                        name = dot > 0 ? fileName[p].substring(0, dot) : fileName[p];
                    }
                    else {
                        currentFolderName += fileName[p] + '/';
                        currentFile.id = currentFolderName;
                        if (document.getElementById(currentFolderName)) {
                            continue;
                        }
                        type = 'folder';
                        extension = '<br/>';
                        name = fileName[p];
                    }
                    currentFile.className = type;

                    currentFile.innerHTML = extension + "<p class='filename'>" + (name.length > 12 ? name.substr(0, 10) + '...' : name) + "</p>";
                    if (parent != null) {
                        parent.appendChild(currentFile);
                        if (type === 'folder') {
                            currentFile.onclick = function () {
                                that.openFolder(this.id);
                            }
                            contents = document.createElement('div');
                            contents.id = currentFolderName + contentSuffix;
                            contents.className = "contents";
                            parent.appendChild(contents);
                        }
                        else if (type == 'file') {
                            currentFile.innerHTML += "<input name='" + i + "' type='hidden'></input>";
                            currentFile.onclick = function () {
                                that.toggleSelectFile(this);
                            };
                        }
                        currentFile.onmouseover = function (e) {
                            var evt = e;
                            var curthat = this;
                            that.tooltipTimeout = setTimeout(function () {
                                that.showFileDetails(evt, curthat);
                            }, 1000);
                        }
                        currentFile.onmouseout = function () {
                            clearTimeout(that.tooltipTimeout);
                            that.hideFileDetails();
                        }
                    }
                }
            }
        }
    }
    this.createView = function () {
        var view = document.getElementById("view");
        var downloadBtn = document.getElementById('download');
        downloadBtn.onclick = function () {
            that.onDownload();
        }
        var cancelBtn = document.getElementById('cancel');
        cancelBtn.onclick = this.closeView;
        var upBtn = document.getElementById('up');
        upBtn.onclick = function () {
            that.openFolder(that.getParentFolder(that.currentFolder));
        }
        var selectBtn = document.getElementById('select');
        selectBtn.onclick = function () {
            that.selectFolder(that.currentFolder);
        }
        var backBtn = document.getElementById('back');
        backBtn.onclick = function () {
            if (that.history.length) {
                that.openFolder(that.history.pop());
                that.openFolder(that.history.pop());
            }
        }
        return view;
    }
    this.showFileDetails = function (e, file) {
        var type = file.hasClass("folder") ? "folder" : "file";
        var name = file.getElementsByClassName("filename")[0].innerText;
        if (type === "folder") {

        }
        else {
            var fileHeader = that.file.files[file.lastChild.name];
            var fileTime = new time(fileHeader.lastModTime);
            var fileDate = new date(fileHeader.lastModDate);
            var detailsTooltip = document.getElementById("fileDetails");
            detailsTooltip.innerHTML = "<b>File Name:</b>" + fileHeader.fileName + "<br/>" +
                                    "<b>Last Modified:</b> " + fileDate.days + "/" + fileDate.months + "/" + fileDate.years + " " + fileTime.hours + ":" + fileTime.minutes + ":" + fileTime.seconds + "<br/>" +
                                    "<b>Compressed Size:</b> " + convertSize(fileHeader.compressedSize) + "<br/>" +
                                    "<b>Uncompressed Size:</b> " + convertSize(fileHeader.unCompressedSize) + "<br/>" +
                                    "<b>Compression Method:</b> " + compressionMethods[fileHeader.compressionMethod];
            detailsTooltip.style.left = (e.pageX + 20) + "px";
            detailsTooltip.style.top = (e.pageY + 20) + "px";
            detailsTooltip.style.display = "block";
            if (that.tooltipTimeout) clearTimeout(that.tooltipTimeout);
            that.tooltipTimeout = setTimeout(that.hideFileDetails, 5000);
        }
    }
    this.hideFileDetails = function () {
        document.getElementById("fileDetails").style.display = "none";
    }
    this.closeView = function () {
        window.close();
    }
    this.openFolder = function (folderName) {
        if (folderName == that.currentFolder || !folderName) {
            return;
        }

        ////////////////////////////////////////////////////////////////////////
        sessionStorage.folder = folderName;
        ////////////////////////////////////////////////////////////////////////

        that.history.push(folderName);
        document.getElementById(folderName + contentSuffix).children.each(function () {
            this.style.display = "inline-block";
        });
        document.getElementById(that.currentFolder + contentSuffix).children.each(function () {
            if (this.hasClass('folder') || this.hasClass('file')) {
                this.style.display = "none";
            }
        });
        that.currentFolder = folderName;
        that.addressBar.update();
    }

    //returns the id/name of the parent folder not the element
    this.getParentFolder = function (id) {
        return id == "/" ? false : document.getElementById(id).parentElement.id.split(contentSuffix[0])[0];
    }

    this.getChildFolders = function (folderName) {
        var childrenNames = [];

        var children = document.getElementById(folderName + contentSuffix);
        if (children != null) {
            children = children.children;
            children.each(function () {
                if (this.hasClass('folder')) {
                    childrenNames.push(this.id);
                }
            });
        }
        return childrenNames;
    }
    this.getChildFiles = function (folderName) {
        var childrenNames = [];
        var children = document.getElementById(folderName + contentSuffix);
        if (children != null) {
            children = children.children;
            children.each(function () {
                if (this.hasClass('file')) {
                    childrenNames.push(this.id);
                }
            });
        }
        return childrenNames;
    }


    this.toggleSelectFile = function (file) {
        var index = that.filesToDownload.indexOf(file.lastChild.name);
        if (index >= 0) {
            that.filesToDownload.splice(index, 1);
            file.removeClass('highlight');
        }
        else {
            that.filesToDownload.push(file.lastChild.name);
            file.addClass('highlight');
        }
    };

    this.deSelectFile = function (file) {
        var index = that.filesToDownload.indexOf(file.lastChild.name);
        if (index >= 0) {
            that.filesToDownload.splice(index, 1);
            file.removeClass('highlight');
        }
        else {
        }
    };

    this.selectFile = function (file) {
        var index = that.filesToDownload.indexOf(file.lastChild.name);
        if (index < 0) {
            that.filesToDownload.push(file.lastChild.name);
            file.addClass('highlight');
        }
        else {
        }
    }



    //selects all of the files in the folder specified
    this.selectFolder = function (folderName) {
        var list = document.getElementById(folderName + contentSuffix).children;
        var count = 0;
        var fileCount = 0;
        list.each(function () {
            if (this.hasClass("highlight")) {
                count++;
            }
            if (this.hasClass('file')) {
                fileCount++;
            }
        });

        if (count < fileCount) {
            list.each(function () {
                if (this.hasClass('file')) {
                    that.selectFile(this);
                }
            });
        }
        else {
            list.each(function () {
                if (this.hasClass('file')) {
                    that.deSelectFile(this);
                }
            });
        }
    }
    //sets a callback for when a file is downloaded and changes its className so it shows a tick
    this.showLoaded = function (name) {
        document.getElementsByName(name)[0].parentElement.addClass("loaded");
    }
    this.showDownload = function (file) {
        var downloadDialog = document.createElement("div");
        downloadDialog.className = "downloadDialog";
        downloadDialog.innerHTML = "<a href='data:application/zip;base64," + btoa(file) + "' >Your file is ready to download.<br>Right click on this dialog and select Save link as..</a>";
        that.view.appendChild(downloadDialog);
    }

    //initialize the view
    this.view = this.createView();
    this.generateFileStructure();
    this.dragSelect = new dragSelect(this);
    this.keyHandler = new keyHandler({
        "select_all": function () {
            that.selectFolder(that.currentFolder);
        },
        "up_a_level": function () {
            that.openFolder(that.getParentFolder(that.currentFolder));
        },
        "back": function () {
            if (that.history.length) {
                that.openFolder(that.history.pop());
                that.openFolder(that.history.pop());
            }
        },
        "download": function () {
            that.onDownload();
        },
        "close": function () {
            window.close();
        }
    });
    this.addressBar = new addressBar(this, document.getElementById("addressBar"));
}


function addressBar(folderView, bar) {
    this.bar = bar;
    var that = this;
    this.update = function () {
        that.bar.innerHTML = '';
        var folderHierarchy = folderView.currentFolder.split('/');
        folderHierarchy.pop(); //remove the last element because it's empty
        var currentPath = '/';
        for (folder in folderHierarchy) {
            currentPath += folderHierarchy[folder] + (folder > 0 ? '/' : '');
            var folderBtn = document.createElement("div");
            folderBtn.className = "folderBtn";
            folderBtn.innerHTML = (folderHierarchy[folder].length > 0 ? folderHierarchy[folder] : 'root') + "<input type='hidden' value='" + currentPath + "'/>";
            folderBtn.onclick = function () { folderView.openFolder(this.lastChild.value); };
            that.bar.appendChild(folderBtn);
            that.generateDropDown(currentPath);
        }
    }
    this.generateDropDown = function (currentPath) {
        var dropdown = document.createElement("div");
        dropdown.className = "folderDropdown arrow";
        var currentFolderChildren = folderView.getChildFolders(currentPath);
        var innerHTML = '';
        for (child in currentFolderChildren) {
            innerHTML += "<li>" + currentFolderChildren[child].split('/')[currentFolderChildren[child].split('/').length - 2] + "<input type='hidden' value='" + currentFolderChildren[child] + "'/></li>"
        }
        dropdown.innerHTML = "<ul class='dropdownList' style='display:none'>" + innerHTML + "</ul>";
        that.bar.appendChild(dropdown);
        dropdown.onclick = function () {
            if (this.firstChild.style.display == "block") {
                this.firstChild.style.display = "none";
                this.removeClass("arrowDown");
                this.addClass("arrow");
            }
            else {
                this.firstChild.style.display = "block";
                this.addClass("arrowDown");
                this.removeClass("arrow");
            }
        }
        var folders = dropdown.firstChild.childNodes;
        for (var i = 0; i < folders.length; i++) {
            folders[i].onclick = function () {
                folderView.openFolder(this.lastChild.value);
            }
        }
    }
    this.update();
}

function keyHandler(map) {
    var that = this;
    this.map = map;
    document.onkeydown = function (evt) {
        var evtText = '';
        if (evt.ctrlKey) {
            evtText += "Ctrl + ";
        }
        if (evt.altKey) {
            evtText += "Alt + ";
        }
        if (evt.shiftKey) {
            evtText += "Shift + ";
        }
        if (evt.keyCode !== 16 && evt.keyCode !== 17 && evt.keyCode !== 18 && keyCodes[evt.keyCode] !== undefined) {
            evtText += keyCodes[evt.keyCode];
            evtText = evtText.trim();
            for (var i in that.map) {
                if (localStorage[i] == evtText) {
                    that.map[i]();
                    return false;
                }
            }
        }
    }
};

function dragSelect(fileBrowser) {
    var that = this;
    var boxId = "selection-box";
    this.dragging = false;
    this.fileBrowser = fileBrowser;
    this.view =  document.getElementById("content");
    this.box;
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    this.anchorPoint = new Point(0, 0);
    this.dragPoint = new Point(0, 0);

    this.view.onmousedown = function (evt) {
        if (that.dragging) {
            that.view.onmouseup();
        }
        else {
            that.dragging = true;
            that.box = document.createElement("div");
            that.box.id = boxId;
            that.view.appendChild(that.box);
            that.updateBoxPosition(evt.x - this.offsetLeft, evt.y - this.offsetTop);
        }
        return false;
    };
    this.view.onmousemove = function (evt) {
        if (that.dragging) {
            that.updateBoxDimensions(evt.x - this.offsetLeft, evt.y - this.offsetTop);
            that.checkSelectedFiles(evt.ctrlKey);
        }
    };
    this.view.onmouseup = this.view.mouseout = function (evt) {
        that.dragging = false;
        if (document.getElementById(boxId)) {
            that.view.removeChild(document.getElementById(boxId));
        }
    };

    this.updateBoxPosition = function (x, y) {
        that.anchorPoint.x = x;
        that.anchorPoint.y = y + that.view.scrollTop;
        that.box.style.left = (x + 1) + "px";
        that.box.style.top = (y + 1 + that.view.scrollTop) + "px";
        //needs to be +1 because if it's put at 
        //x the element will be under the mouseup event 
        //and the click on files/folders will not fire
    };
    this.updateBoxDimensions = function (x, y) {
        that.dragPoint.x = x;
        that.dragPoint.y = y + that.view.scrollTop;

        if (that.dragPoint.x < that.anchorPoint.x) {
            that.box.style.left = that.dragPoint.x + "px";
            that.box.style.right = (that.view.clientWidth - that.anchorPoint.x) + "px";
        }
        else {
            that.box.style.left = that.anchorPoint.x + "px";
            that.box.style.right = (that.view.clientWidth - that.dragPoint.x) + "px";
        }
        if (that.dragPoint.y < that.anchorPoint.y) {
            that.box.style.top = that.dragPoint.y + "px";
            that.box.style.bottom = (that.view.clientHeight - that.anchorPoint.y) + "px";
        }
        else {
            that.box.style.top = that.anchorPoint.y + "px";
            that.box.style.bottom = (that.view.clientHeight - that.dragPoint.y) + "px";
        }
    };
    this.checkBounds = function (file) {
        var leftX = parseInt(that.box.style.left);
        var topY = parseInt(that.box.style.top);
        var rightX = document.body.clientWidth - parseInt(that.box.style.right);
        var bottomY = document.body.clientHeight - parseInt(that.box.style.bottom);
        return ((file.offsetTop > topY &&
                 file.offsetLeft > leftX &&
                 file.offsetTop <  bottomY &&
                 file.offsetLeft < rightX)
                 ||
                (file.offsetTop + file.clientHeight > topY &&
                 file.offsetLeft + file.clientWidth > leftX &&
                 file.offsetTop + file.clientHeight < bottomY &&
                 file.offsetLeft + file.clientWidth < rightX)
                 ||
                (file.offsetTop > topY &&
                 file.offsetLeft + file.clientWidth > leftX &&
                 file.offsetTop < bottomY &&
                 file.offsetLeft + file.clientWidth < rightX)
                 ||
                (file.offsetTop + file.clientHeight > topY &&
                 file.offsetLeft > leftX &&
                 file.offsetTop + file.clientHeight < bottomY &&
                 file.offsetLeft < rightX));


    };
    this.checkSelectedFiles = function (ctrlKey) {
        var files = that.fileBrowser.getChildFiles(that.fileBrowser.currentFolder);
        for (name in files) {
            var curFile = document.getElementById(files[name]);
            if (that.checkBounds(curFile)) {
                that.fileBrowser.selectFile(curFile);
            }
            else if(!ctrlKey){
                that.fileBrowser.deSelectFile(curFile);
            }
        }
    };
    
    
}
function time(timestamp) {
    timestamp = timestamp.toString(2);
    var l = timestamp.length;
    this.seconds = parseInt(timestamp.substring(l - 5, l), 2) * 2;
    this.minutes = parseInt(timestamp.substring(l - 11, l - 5), 2);
    this.hours = parseInt(timestamp.substring(0, l - 11).length ? timestamp.substring(0, l - 11) : 0, 2);
}
function date(datestamp) {
    datestamp = datestamp.toString(2);
    var l = datestamp.length;
    this.days = parseInt(datestamp.substring(l - 5, l), 2);
    this.months = parseInt(datestamp.substring(l - 9, l - 5), 2);
    this.years = 1980 + parseInt(datestamp.substring(0, l - 9), 2);
}
function convertSize(size) {
    size = parseInt(size);
    return (size > 1024 ? size > 1024 * 1024 ? size > 1024 * 1024 * 1024 ? (Math.round(size / (1024 * 1024 * 1024))) + "GB" : (Math.round(size / (1024 * 1024))) + "MB" : (Math.round(size / 1024)) + "KB" : size + "B");
}