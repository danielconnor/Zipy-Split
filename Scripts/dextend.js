dextend = {
    version:"0.85"
};
dextend.extend = function (subClass, baseClass) {
    function inheritance() { };
    inheritance.prototype = baseClass.prototype;

    subClass.prototype = new inheritance();
    subClass.prototype.constructor = subClass;
    subClass.baseConstructor = baseClass;
    subClass.superClass = baseClass.prototype;
};

Function.prototype.hook = function (func, parent) {
    var cur = this;
    if (!parent)
        parent = window;
    parent[cur.name] = function () {
        func(arguments);
        return cur.apply(this, arguments)
    };
};


NodeList.prototype.each = HTMLCollection.prototype.each = function (func) {
    for (var i = 0; i < this.length; i++) {
        func.call(this[i]);
    }
    return this;
};

NodeList.prototype.property = HTMLCollection.prototype.property = function (property, value) {
    this.each(function () {
        this[property] = value;
    });
};

Element.prototype.hasClass = function (className) {
    return new RegExp("(^| )" + className + "($| )").test(this.className);
};

Element.prototype.removeClass = function (className) {
    if (this.hasClass(className)) {
        this.className = this.className.replace(new RegExp("( |^)"+className+""),"");
    }
	return this;
};


Element.prototype.addClass = function (className) {
    if (!this.hasClass(className)) {
        this.className += (this.className.length > 0 ? " " : "") + className;
    }
	return this;
};

Element.prototype.swapClass = function (oldClass, newClass) {
    this.removeClass(oldClass);
    this.addClass(newClass);
	return this;
};

Element.prototype.show = function () {
    this.removeClass("hidden");
};
Element.prototype.hide = function () {
    this.addClass("hidden");
};
Element.prototype.index = function () {
    var index = 0;
    var el = this;
    while ((el = el.previousElementSibling) != null) index++;
    return index;
};

Element.prototype.isAncestor = function (element) {
    var el = element;
    while ((el = el.parentNode) != null) {
        if (el == this) return true;
    }
    return false;
};
Element.prototype.getAncestorByClassName = function (c) {
    var el = this;
    while ((el = el.parentNode) != null && !el.hasClass(c));
    return el;
};

Element.prototype.insertAt = function (element, index) {
    if (index === this.children.length) return this.appendChild(element);
    if (index >= -1) this.insertBefore(element, this.children[index + 1]);
    return null;
};

Element.prototype.prepend = function (element) {
	this.insertAt(element,0);
};

Element.prototype.insertAfter = function (newElement, referenceElement) {
    return referenceElement && referenceElement.nextElementSibling ? this.insertBefore(newElement, referenceElement.nextElementSibling) :
           this.appendChild(newElement);
};

Element.prototype.ancestor = function (filter) {

};

Element.prototype.swap = function (element) {
    if (element.parentNode) {
        element.parentNode.replaceChild(this, element);
        return true;
    }
    else {
        return false;
    }
};



Element.prototype.getElementById = function (id) {
    return this.querySelector("#" + id);
};

Element.prototype.appendChildren = function (elements) {
    for (var e in elements) {
        this.appendChild(elements[e]);
    }
};

Element.prototype.remove = function () {
    if (this.parentNode != null) {
        this.parentNode.removeChild(this);
        return true;
    }
    return false;
};

HTMLInputElement.prototype.clear = HTMLTextAreaElement.prototype.clear = function () {
    this.value = "";
};

window.parameters = function (params) {
    var paramText = "";
    for (var p in params) {
        if (paramText.length)
            paramText += "&";
        paramText += p + "=" + params[p];
    }
    return paramText;
};

window.post = function (url, params, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (callback && xhr.readyState == 4)
            callback(xhr);
    }
    xhr.open("POST", url, true);
    var formData = dextend.FormData ? new dextend.FormData(xhr) : new FormData();
    for (var i in params) {
        formData.append(i, params[i]);
    }
    xhr.send(formData);
};
window.get = function (url, params, callback) {
    var xhr = new XMLHttpRequest();
    xhr.followRedirects = false;
    xhr.onreadystatechange = function () {
        if (callback && xhr.readyState == 4)
            callback(xhr);
    }
    xhr.open("GET", url + "?" + parameters(params), true);

    xhr.send();
};
String.prototype.shorten = function(length,append) {
	append = append || "...";
	return this.length > length ? this.substr(0, length - append.length + 1) + append : this;
}
String.prototype.parseParams = function() {
    var results = {};
	var str = this.indexOf("?") > -1 ? this.split("?")[1] :  this;
    if(str.indexOf("=") > -1) {
        var params = str.split("&");
        for (var i = 0; i < params.length; i++) {
            var param = params[i].split("=");
            results[param[0]] = decodeURIComponent(param[1]);
        }
    }
    return results;
};
String.prototype.parseURI = function () {
    var result = {
        url: "",
        params: {},
        hashParams: {}
    };
    var hashStart = this.indexOf("#");
    var queryStart = this.indexOf("?");
    var urlEnd = 0;
    if(hashStart > -1 && queryStart > -1) {
        urlEnd = Math.min(hashStart,queryStart);
    }
    else if(hashStart > -1) {
        urlEnd = hashStart;
    }
    else if(queryStart > -1) {
        urlEnd = queryStart;
    }

    result.url = this.substring(0,urlEnd);

    var split = this.split("?");
    var params = split[split.length - 1];
    var hash = "";
    if(params.indexOf("#") > -1) {
        var paramSplit = params.split("#");
        params = paramSplit[0];
        hash = paramSplit[1];
    }
    result.hashParams = hash.parseParams(hash);
    result.params = hash.parseParams(params);
    return result;
};

dextend.parse = function (text) {
    var j;
    try {
        eval("dextend.temp = " + text);
        j = dextend.temp;
        delete dextend.temp;
    }
    catch (e) {
        j = 0;
    }
    return j;
};

function element(type, options) {
    var elem = document.createElement(type);
    for (var i in options) {
        elem[i] = options[i];
    }
    return elem;
}

FormData = window["FormData"] ? window["FormData"] : dextend.FormData = function (xhr) {
    var formData = this;

    var boundaryString = "AaBbCcX30";
    var boundary = "--" + boundaryString;

    this.content = "\r\n" + boundary + "\r\n";
    this.append = function (name, value) {
        var isFile = false;
        if (value instanceof File) {
            console.log(value);
            isFile = true;
            formData.content += "Content-Disposition: form-data; name='" + name + "'; filename='" + value.name + "'\r\n";
            formData.content += "Content-Type: " + value.type + "\r\n";
            formData.content += "\r\n";
            value = value.getAsDataURL();
        }
        else {
            formData.content += "Content-Disposition: form-data; name='" + name + "'\r\n";
            formData.content += "Content-Type: text/plain\r\n";
            formData.content += "\r\n";
        }
        formData.content += value;
        formData.content += "\r\n";
        formData.content += boundary + "\r\n";
        if (isFile) formData.append("dataurl", "true");

    };
    xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundaryString);

    xhr.send.hook(function (args) {
        args[0] = formData.content;
    }, xhr);

};

dextend.elems = [
"a",
"abbr",
"acronym",
"address",
"applet",
"area",
"article",
"aside",
"audio",
"b",
"base",
"basefont",
"bdo",
"big",
"blockquote",
"body",
"br",
"button",
"canvas",
"caption",
"center",
"cite",
"code",
"col",
"colgroup",
"command",
"datalist",
"dd",
"del",
"details",
"dfn",
"dir",
"div",
"dl",
"dt",
"em",
"embed",
"fieldset",
"figcaption",
"figure",
"font",
"footer",
"form",
"frame",
"frameset",
"h1",
"h2",
"h3",
"h4",
"h5",
"h6",
"head",
"header",
"hgroup",
"hr",
"html",
"i",
"iframe",
"img",
"input",
"ins",
"keygen",
"kbd",
"label",
"legend",
"li",
"link",
"map",
"mark",
"menu",
"meta",
"meter",
"nav",
"noframes",
"noscript",
"object",
"ol",
"optgroup",
"option",
"output",
"p",
"param",
"pre",
"progress",
"q",
"rp",
"rt",
"ruby",
"s",
"samp",
"script",
"section",
"select",
"small",
"source",
"span",
"strike",
"strong",
"style",
"sub",
"summary",
"sup",
"table",
"tbody",
"td",
"textarea",
"tfoot",
"th",
"thead",
"time",
"title",
"tr",
"tt",
"u",
"ul",
"var",
"video",
"wbr",
"xmp"];

for(var i in dextend.elems) {
	dextend[dextend.elems[i]] = (function(){var name = dextend.elems[i];return function(options){ return element(name,options)};})();
}