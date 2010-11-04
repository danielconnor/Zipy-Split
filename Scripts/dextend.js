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
    return this.className.indexOf(className) > -1;
};

Element.prototype.removeClass = function (className) {
    if (this.hasClass(className)) {
        var newClassName = "";
        var classNames = this.className.split(" ");
        for (var i = 0; i < classNames.length - 1; i++) {
            if (classNames[i] != className) {
                newClassName += classNames[i] + " ";
            }
        }
        if (classNames[i] != className) {
            newClassName += classNames[i];
        }
        this.className = newClassName.trim();
    }
};


Element.prototype.addClass = function (className) {
    if (!this.hasClass(className)) {
        this.className += " " + className;
    }
};

Element.prototype.swapClass = function (oldClass, newClass) {
    this.removeClass(oldClass);
    this.addClass(newClass);
};

Element.prototype.offset = function () {
    var box = this.getBoundingClientRect();
    var body = this.ownerDocument.body;
    var docElem = this.ownerDocument.documentElement;
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;
    var top = box.top + (self.pageYOffset || body.scrollTop) - clientTop;
    var left = box.left + (self.pageXOffset || body.scrollLeft) - clientLeft;
    return { top: top, left: left };
};

Element.prototype.gebtn = Element.prototype.getElementsByTagName;
Element.prototype.gebn = Element.prototype.getElementsByName;
Element.prototype.gebc = Element.prototype.getElementsByClassName;
Element.prototype.gebi = Element.prototype.getElementById = function (id) {
    return this.querySelector("#" + id);
};

Element.prototype.find = Element.prototype.querySelectorAll;


Element.prototype.load = function (callback) {
    
};