
// inspired by Ramon y Cajal drawings
// please note these drawings are not anatomically correct depictions of neurons, I was just looking for a cool effect :)

var settings = {
	initialNeuritesMin: 3,
	initialNeuritesMax: 50,
	stopChance: 0.005,
	branchChance: 0.005,
	startThickness: 200,
	minThickness: 0.5,
	thicknessStandardDeviation: 1.5,
	newBranchDirectionStandardDeviation: 2,
	growthDirectionStandardDeviation: 2,
	growthDistanceStandardDeviation: 2,
	animate: true,
	stepsPerSecond: 100
}

var div = document.getElementById('neuron-draw');
var canvas = document.createElement('canvas'); // create the canvas
canvas.setAttribute("id", "c");
canvas.width = div.clientWidth; // fill the window
canvas.height = div.clientHeight;
// document.body.appendChild(canvas);
div.appendChild(canvas);
var ctx = canvas.getContext('2d');

var neurites = []; // array holding all neurites
var finishedNeurites, growCycle;

// get settings input elements (if there are any)
var settingsToggle = document.getElementById("settingsToggle");
var settingsForm = document.getElementById("settingsForm");
settingsToggle.onclick = function(){
	if (settingsForm.style.display == "none") {
		settingsForm.style.display = "block";
	} else {
		settingsForm.style.display = "none";
	}
}
var drawButton = document.getElementById("drawButton");
if (drawButton) {
	drawButton.onclick = function(){reset()};
}
var animateCheckbox = document.getElementById("animateCheckbox");
var stepsPerSecondInput = document.getElementById("stepsPerSecondInput");
var initialNeuritesMinInput = document.getElementById("initialNeuritesMinInput");
var initialNeuritesMaxInput = document.getElementById("initialNeuritesMaxInput");
var stopChanceInput = document.getElementById("stopChanceInput");
var branchChanceInput = document.getElementById("branchChanceInput");
var startThicknessInput = document.getElementById("startThicknessInput");
var minThicknessInput = document.getElementById("minThicknessInput");
var thicknessSdInput = document.getElementById("thicknessSdInput");
var newBranchDirectionSdInput = document.getElementById("newBranchDirectionSdInput");
var growthDirectionSdInput = document.getElementById("growthDirectionSdInput");
var growthDistanceSdInput = document.getElementById("growthDistanceSdInput");

function reset() {
	// set settings from inputs (if there are any)
	if (animateCheckbox) {
		settings.animate = animateCheckbox.checked;
	}
	if (stepsPerSecondInput) {
		settings.stepsPerSecond = stepsPerSecondInput.value;
	}
	if (initialNeuritesMinInput) {
		settings.initialNeuritesMin = initialNeuritesMinInput.value;
	}
	if (initialNeuritesMaxInput) {
		settings.initialNeuritesMax = initialNeuritesMaxInput.value;
	}
	if (stopChanceInput) {
		settings.stopChance = stopChanceInput.value;
	}
	if (branchChanceInput) {
		settings.branchChance = branchChanceInput.value;
	}
	if (startThicknessInput) {
		settings.startThickness = startThicknessInput.value;
	}
	if (minThicknessInput) {
		settings.minThickness = minThicknessInput.value;
	}
	if (thicknessSdInput) {
		settings.thicknessStandardDeviation = thicknessSdInput.value;
	}
	if (newBranchDirectionSdInput) {
		settings.newBranchDirectionStandardDeviation = newBranchDirectionSdInput.value;
	}
	if (growthDirectionSdInput) {
		settings.growthDirectionStandardDeviation = growthDirectionSdInput.value;
	}
	if (growthDistanceSdInput) {
		settings.growthDistanceStandardDeviation = growthDistanceSdInput.value;
	}
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	finishedNeurites = 0; // keep track of neurites which have reached their end
	growCycle = 1; // keep track of how many growth cycles we've had
	neurites = [];
	spawnNeurites();
	grow();
}

reset();

function spawnNeurites() {
	var n = Math.max(Math.floor(Math.random()*settings.initialNeuritesMax+1),settings.initialNeuritesMin); // number of initial neurites eminating from the nucleus, randomly chosen between 3 and 49
	for (var i=0; i<n; i++) {
		neurites.push({
			prevPoint: {x: canvas.width/2, y: canvas.height/2},
			direction: 2*Math.PI*Math.random(), // general direction of neurite outgrowth
			stop: false, // true if neurite has reached its end
			order: 1, // 1st order neurites are the original ones that start at the nucleus, new branches are 2nd order neurites, branches from those branches are 3rd order neurites, etc.
		});
	};
	console.log('Number of initial neurites: '+n);
}

function grow() {
	for (var i=0; i < neurites.length; i++) { // iterate through all neurites and grow each one out a teeny tiny bit
		if (neurites[i].stop == true) { // if this neurite is already finished, skip it
			continue;
		};
		propagate(neurites[i]);
	};
	if (finishedNeurites < neurites.length) { // if not all neurites are finished yet, do another growing cycle
		growCycle++;
		if (settings.animate) {
			setTimeout(grow,1000/settings.stepsPerSecond);
		} else {
			grow();
		}
	};
};

function propagate(neurite) { // this is where the magic happens
	var prevPoint = neurite.prevPoint; // where the neurite currently ends
	var nextPoint = {x: prevPoint.x+getNormalRandom()*settings.growthDirectionStandardDeviation+radialToVector(neurite.direction).x*(Math.random()*settings.growthDistanceStandardDeviation), 		// get the previous point and move it in the direction the neurite is growing in,
					 y: prevPoint.y+getNormalRandom()*settings.growthDirectionStandardDeviation+radialToVector(neurite.direction).y*(Math.random()*settings.growthDistanceStandardDeviation)}; 	// also add some noise by randomizing the growth rate and translating the new end point by a random value from a normal distribution with mean 0 and standard deviation 2 (I think it's 2? Not sure.)
	ctx.beginPath(); // draw a line from the previous end point to the new end point
	ctx.moveTo(neurite.prevPoint.x, neurite.prevPoint.y);
	ctx.lineWidth = Math.max(getNormalRandom()*settings.thicknessStandardDeviation+settings.startThickness/(growCycle+10)/neurite.order,settings.minThickness); 	// thickness of the neurite decreases with growth cycle and neurite order, with a bit of randomness in it, but is never thinner than 0.5.
																							// note that "100/(growCycle+10)" is asymptotic and thus all neurites start off really thick (the nucleus is actually just a big blob of ridiculously thick neurites) and rapidly become thinner as they propagate outward, but never reach 0.
	ctx.lineTo(nextPoint.x, nextPoint.y);
	ctx.stroke();
	neurite.prevPoint = nextPoint; // this cycle's 'next point' is the next cycle's 'previous point'
	if (Math.random() < (settings.branchChance/neurite.order)) { // every propagation step, there is a small chance this neurite branches and spawns a new neurite
		neurites.push({
			prevPoint: {x: nextPoint.x, y: nextPoint.y},
			direction: neurite.direction+getNormalRandom()*settings.newBranchDirectionStandardDeviation, // basically the branching neurite has the same direction as its mother, but with a slight random offset
			stop: false,
			order: neurite.order+1, // the new branching neurite is one order higher than its mother
		});
	};
	if (nextPoint.x < 0 || nextPoint.x > canvas.width || nextPoint.y < 0 || nextPoint.y > canvas.height // stop growing if the neurite reaches the edge of the canvas
	|| Math.random() < (settings.stopChance*neurite.order)) { // also, there's a small chance every cycle that it just stops dead.
		console.log('propagation stopped');
		neurite.stop = true;
		finishedNeurites++; // keep track of finished neurites
	};
};

// handy-dandy helper functions:

function radialToVector(radial) {
	return {x: Math.cos(radial), y: Math.sin(radial)};
};

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNormalRandom() { // returns a random number from an approximated normal distribution with mean 0 and standard deviation 1 (I think it's 1? Not sure.)
	return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
};
