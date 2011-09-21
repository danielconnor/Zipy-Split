init = function() {
	var btns = document.querySelectorAll(".toggle-button");
	btns.each(function(){
		this.addEventListener("click",function() {
			if(this.hasClass("on")) {
				this.swapClass("on","off");
			}
			else {
				this.swapClass("off","on");
			}
		});
	});
		
	var settings = [];
	for(var i in DefaultSettings) {
		settings.push(new SettingItem(DefaultSettings[i]));
	}
	
}

function KeyboardShortcutInput(initial,onchange) {
	var element = new dextend.div();
	var input = dextend.input({
							  	type: "text",
								value:initial
							  });
	var display = new dextend.div({
								  className:"display"
								  });

	var showKeys = function(text) {
		if(!text) return;
		display.innerHTML = "";
		var keyStrs = text.split(" + ");
		for(var i = 0; i < keyStrs.length; i++) {
			if(keyStrs[i].length > 0) {
				display.appendChild(new dextend.div({
					className: "key",
					innerText: keyStrs[i]
				}));
			}
		}
	}

	var currentValue = initial;
	showKeys(currentValue);
	
	display.addEventListener("mousedown",function(e) {
		e.preventDefault();
		input.focus();
	},true);
	
	input.addEventListener("keydown", function(e){
		var buttonText = "";
		if(e.ctrlKey) {
			buttonText += "Ctrl + ";
		}
		if(e.shiftKey) {
			buttonText += "Shift + ";
		}
		if(e.altKey) {
			buttonText += "Alt + ";
		}
		if(buttonText.length > 0 ) {
			if(!(e.keyCode >= 16 && e.keyCode <= 18 )) {
				buttonText += keyCodes[e.keyCode];
				if(!duplicateShortcut(buttonText)) {
					currentValue = buttonText;
					onchange && onchange(buttonText);
				}
			}
			this.value = buttonText;
			showKeys(buttonText);
		}
		e.preventDefault();
		e.stopPropagation();
	},true);
	
	input.addEventListener("keyup", function(e){
		this.value = currentValue;
		showKeys(currentValue);
		e.preventDefault()
		e.stopPropagation();
	},true);
	input.addEventListener("blur", function(e){
		this.value = currentValue;
		showKeys(currentValue);
		e.preventDefault()
		e.stopPropagation();
	},true);
	
	element.appendChild(input);
	element.appendChild(display);
	return element
}
function OptionInput(initial,onchange) {
	var element = new dextend.div({
								  	className: "toggle-button " + (initial == "true" ? "on" : "off"),
									innerText: "On   Off"
								  });
	element.addEventListener("click",function() {
		if(this.hasClass("on")) {
			this.swapClass("on","off");
		}
		else {
			this.swapClass("off","on");
		}
		onchange && onchange(this.hasClass("on"));
	});
	
	return element;
}

function SettingItem(item){
	var parent = document.getElementById(item.type);
	var input;
	console.log(item);
	var saveInput = function(input) {
		localStorage[item.id] = input;
	}
	
	switch(item.type){
		case "keyboard-shortcut":
			input = new KeyboardShortcutInput(localStorage[item.id],saveInput);
		break;
		case "option":
			input = new OptionInput(localStorage[item.id],saveInput);
		break;
	}
	
	var element = new dextend.li();
	var name = new dextend.span({
									innerText: item.name + ": "
								});
	element.appendChild(name);
	element.appendChild(input);
	parent.appendChild(element);
}
window.onselectstart = function(e) {
	e.preventDefault();
}