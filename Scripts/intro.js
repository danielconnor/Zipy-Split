

function Intro() {
	var intro = this;
	var currentSection = 0;
	var sections = document.querySelectorAll("section");
	history.pushState(true, null, '?state='+currentSection);
	
	var btns = document.querySelectorAll(".button");
	btns.each(function(){
		this.addEventListener("click",function() {
			intro.next(true);
		});
	});	
	
	this.next = function() {
		currentSection++;
		update(true);
	};	
	var update = function(s) {
		if(currentSection >= sections.length) {
			window.close();
		}
		s && history.pushState(true, null, '?state='+currentSection);
		
		var index = 0;
		sections.each(function(){
			if(index < currentSection) {
				this.className = "finished";
			}
			else if(index > currentSection) {
				this.className = "waiting";
			}
			else {
				this.className = "active";
			}
			index++;
		});
	}
	window.addEventListener('popstate', function(e) {
		if(window.location.search.length > 0) {
			currentSection = window.location.search.parseParams()["state"];
			update(false);
		}
		e.preventDefault();
	},true);
};

function Setting(id) {
	var element = document.getElementById(id);
	if(element){
		element.querySelector(".yes.button").addEventListener("click",function() {
			localStorage[id] = true;
		});
		element.querySelector(".no.button").addEventListener("click",function() {
			localStorage[id] = false;
		});
	}
};

var intro = null;
function onload() {
	var settings = [];
	intro = new Intro();
	for(var i in DefaultSettings) {
		settings.push(new Setting(i));
	}
	
	document.getElementById("sample").onclick = function(e) {
		e.preventDefault();
        chrome.extension.getBackgroundPage().zipySplit.openFileViewer("http://pixlcoder.com/zipysplit/sample.zip");
	};
//	document.getElementById("walkthrough").onclick = function(e) {
//		e.preventDefault();
//        chrome.extension.getBackgroundPage().zipySplit.openFileViewer("http://pixlcoder.com/zipysplit/sample.zip",true);
//	};
};
