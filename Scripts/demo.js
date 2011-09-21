function step(oncomplete) {
	
	
	
	
}

function demo() {
	var currentStep = 0;
	
	var nextStep = function() {
		steps[currentStep++].deactivate();
		steps[currentStep] && steps[currentStep].activate();
	}
	
	var steps = [];
};



