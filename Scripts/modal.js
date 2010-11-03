
modal.prototype.transitionTypes = {
    fade: 0,
    expand :1,
    slide :2
};

function modal(params) {
    this.transition = this.transitionTypes[params.transitionType] || params.transitionType || this.transitionTypes.fade;
    this.transitionDuration = params.transitionDuration || 1000;
}
modal.prototype.animateEntrance = function () {
    switch (this.transition) {
        case this.transitionTypes.fade:
            if (this.box.style.opacity < 1) {
                this.box.style.opacity += 1 / (this.transitionDuration / 10);
                setTimeout(this.animateEntrance, 10);
            }
            break;
        case this.entranceTypes.expand:
            if (this.box.style.left < (window.document.width / 2)) {
                this.box.style.left += (window.document.width / 2) / (this.transitionDuration / 10);
                setTimeout(this.animateEntrance, 10);
            }
            break;
        case this.entranceTypes.slide:
            if (this.box.style.left < (window.document.width / 2)) {
                this.box.style.left += (window.document.width / 2) / (this.transitionDuration / 10);
                setTimeout(this.animateEntrance, 10);
            }
            break;
    }
};
modal.prototype.setupAnimation = function () {
    switch (this.transition) {
        case this.transitionTypes.fade:
            this.box.style.opacity = 0;
            break;
        case this.entranceTypes.expand:
            this.box.width = this.box.height = 0;
            break;
        case this.entranceTypes.slide:
            this.box.left = -this.box.width;
            break;
    }
};
modal.prototype.open = function () {
    this.setupTransition();
    document.appendChild(this.box);
    this.animateEntrance();
};
modal.prototype.close = function () {
};