var compressionMethods = [
        "Store",
        "Shrunk",
        "Reduced with compression factor 1",
        "Reduced with compression factor 2",
        "Reduced with compression factor 3",
        "Reduced with compression factor 4",
        "Implode",
        "Tokenizing",
        "Deflate",
        "Deflate64",
        "PKWARE Data Compression Library Imploding",
        "",                //Reserved by PKWARE
        "BZIP2",
        "",                //Reserved by PKWARE
        "LZMA",
        "",                //Reserved by PKWARE
        "",                //Reserved by PKWARE
        "",                //Reserved by PKWARE
        "IBM TERSE",
        "IBM LZ77",
        "WavPacked",
        "PPMd"
];
var versionMadeBy = [
        "MS-DOS",
        "Amiga",
        "OpenVMS",
        "UNIX",
        "VM/CMS",
        "Atari ST",
        "OS/2 H.P.F.S.",
        "Macintosh",
        "Z-System",
        "CP/M",
        "Windows NTFS",
        "MVS (OS/390 - Z/OS)",
        "VSE",
        "Acorn Risc",
        "VFAT",
        "alternate MVS",
        "BeOS",
        "Tandem",
        "OS/400",
        "OS/X"
];

var keyCodes = {
    8: "Backspace",
    9: "Tab",
    13: "Enter",
    16: "Shift",
    17: "Ctrl",
    18: "Alt",
    19: "Pause",
    20: "Caps_Lock",
    27: "Esc",
    32: "Space",
    33: "Page_Up",
    34: "Page_Down",
    35: "End",
    36: "Home",
    37: "Arrow_Left",
    38: "Arrow_Up",
    39: "Arrow_Right",
    40: "Arrow_Down",
    45: "Insert",
    46: "Delete",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    59: ";",
    61: "=",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    91: "Windows",
    92: "Windows",
    93: "Menu",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    186: ";",
    187: "=",
    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "'",
    219: "[",
    220: "\\",
    221: "]",
    222: "#",
    223: "`"
};
var DownloadStatus = {
    notInitialised : 0,
    downloading : 1,
    paused : 2,
    finished : 3
};

function log(item) {
    if (localStorage["logging"]) {
        console.log(item);
    }
}
String.prototype.isUrl = function() {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(this);
}

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

function littleToBigEndian(start, length, data) {
    var hex = '';
    for (var i = start + length - 1; i >= start; i--) {
        hex += data[i];
    }
    return hex;
};

function bigToLittleEndian(data) {
	var hex = "";
    if (data.length % 2 != 0) {
        data = "0" + data;
    }
    for (var i = data.length - 2, p = 0; i >= 0; i -= 2, p++) {
        hex += data[i] + data[i + 1];
    }
    return hex;
}

function convertData(data) {
    var convertedData = [];
    for (var i = 0; i < data.length; i++) {
        convertedData[i] = decimalToHex(data.charCodeAt(i));
    }
    return convertedData;
};


function allIndexesOf(data, pattern) {
    var foundLocations = [];
    var numFinds = 0;
    if (pattern.length > data.length) {
        return -1;
    }
    for (var i = 0; i < data.length - pattern.length; i++) {
        var found = true;
        for (var j = 0; j < pattern.length; j++) {
            if (data[i + j] != pattern[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            foundLocations[numFinds] = i;
            numFinds++;
        }
        i += j;
    }
    return numFinds ? numFinds === 1 ? foundLocations[0] : foundLocations : -1;
};


function indexOf(data, pattern) {
    var foundLocations = [];
    var numFinds = 0;
    if (pattern.length > data.length) {
        return -1;
    }
    for (var i = 0; i < data.length - pattern.length; i++) {
        var found = true;
        for (var j = 0; j < pattern.length; j++) {
            if (data[i + j] != pattern[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i;
        }
    }
    return -1;
};

function lastIndexOf(data, pattern) {
    var foundLocations = [];
    var numFinds = 0;
    if (pattern.length > data.length) {
        return -1;
    }
    for (var i = (data.length - pattern.length) - 1; i > 0; i--) {
        var found = true;
        for (var j = 0; j < pattern.length; j++) {
            if (data[i + j] != pattern[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            return i;
        }
    }

    return -1;
};