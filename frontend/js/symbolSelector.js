"use strict";

var lockedWannabeSample = false;
var validated = false;
var _chosenIndex = 0;

function loadWannabeSamples(wannabeSamples, blacklist) {
	if (wannabeSamplesList.length > 0) { // not reloading.
		return;
	}
	let wannabeSamplesMap = {};
	for (let category in wannabeSamples) {
		if (blacklist.indexOf(category) !== -1) {
			continue;
		}
		for (let i=0; i < wannabeSamples[category].length; ++i) {
			let sample = wannabeSamples[category][i];
			let symbol = "symbol" in sample ? sample.symbol : "";
			let unicode = "unicode" in sample ? sample.unicode : "";
			if (symbol === "") {
				console.log("Missing symbol in wannabe sample: " + sample);
				continue;
			}
			if (symbol in wannabeSamplesMap && wannabeSamplesMap[symbol] !== unicode) {
				console.log("Warning: several unicodes given to the same symbol " + symbol +
					" (" + wannabeSamplesMap[symbol] + " vs " + unicode + ")");
			}
			if (! (symbol in wannabeSamplesMap) || wannabeSamplesMap[symbol] === "") {
				wannabeSamplesMap[symbol] = unicode;
			}
		}
	}
	for (let symbol in wannabeSamplesMap) {
		wannabeSamplesList.push({symbol: symbol, unicode: wannabeSamplesMap[symbol]});
	}
	console.log("Loaded " + wannabeSamplesList.length + " symbols for dataset creation.");
}

function validateWannabeSamples() {
	if (validated) {
		return;
	}
	$("#validationOverlay")[0].style.display = $("#waitingMessage")[0].style.display = "block";
	$("#wannabeSample").hide();
	setTimeout(function() {
		let startTime = performance.now();
		let newList = [];
		for (let i=0; i < wannabeSamplesList.length; ++i) {
			if (drawSample("#wannabeSample", wannabeSamplesList[i], 0)) {
				newList.push(wannabeSamplesList[i]);
			}
		}
		let diff = wannabeSamplesList.length - newList.length;
		console.log("Removed " + diff + " not drawable wannabe samples.");
		wannabeSamplesList = newList;
		validated = true;
		if (diff > 0) {
			console.log("Validated list:", wannabeSamplesList);
		}
		let validationTime = elapsedTime(startTime); // in ms
		console.log("Validation time:", validationTime, "ms");
		$("#wannabeSample").show();
		$("#validationOverlay")[0].style.display = $("#waitingMessage")[0].style.display = "none";
	}, 0); // 0 ms
}

function nextDrawableSample() {
	if (lockedWannabeSample) {
		return;
	}
	if (wannabeSamplesList.length === 0) {
		alert("Empty wannabe samples list!");
		return;
	}
	validateWannabeSamples();
	setTimeout(function() {
		currentWannabeSample = _chooseWannabeSample();
		// console.log("currentWannabeSample:", currentWannabeSample);
		drawSample("#wannabeSample", currentWannabeSample, shownSymbolSize);
		lockedWannabeSample = true;
	}, 0); // 0 ms
}

// Returns symbols randomly between the less sampled. Not to be used in generateMockSamples().
function _chooseWannabeSample() {
	if (_chosenIndex === 0) {
		shuffle(wannabeSamplesList);
	}
	let chosenOne = wannabeSamplesList[_chosenIndex];
	_chosenIndex = (_chosenIndex + 1) % wannabeSamplesList.length;
	return chosenOne;
}

// Fisher-Yates-Durstenfeld shuffle:
function shuffle(array) {
	for (let i = array.length - 1; i > 0; --i) {
		let j = Math.floor(Math.random() * (i + 1));
		let temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}
