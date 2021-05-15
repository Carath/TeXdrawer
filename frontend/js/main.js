"use strict";

// Settings:
const frameMargin = 0.05;
const lineThickness = 6;
const samplesSize = 3;
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";

var canvas = null;
var ctx = null;

window.onload = function() {
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	canvas.addEventListener("mousedown", startInputs);

	let stats = document.getElementById("stats");
	stats.textContent = "";

	let exportButton = document.getElementById("exportButton");
	exportButton.addEventListener("click", function(e) {
		save();
	});

	let retryButton = document.getElementById("retryButton");
	retryButton.addEventListener("click", function(e) {
		clearInputs();
	});

	let submitButton = document.getElementById("submitButton");
	submitButton.addEventListener("click", function(e) {
		submitSymbol();
	});

	let showSamplesButton = document.getElementById("showSamplesButton"); // for testing purposes
	showSamplesButton.addEventListener("click", function(e) {
		let resized = resize(inputStrokes);
		showSamples(inputStrokes, samplesColor);
		showSamples(resized, rescaledSamplesColor);
	});

	let queryButton = document.getElementById("queryButton");
	queryButton.addEventListener("click", function(e) {
		let serviceName = "hwrt"; // TODO: dehardcode this.
		classifyRequest(serviceName, inputStrokes);
		// TODO: apply some preprocessing like resize() here?
	});

	let testButton = document.getElementById("testButton");
	testButton.addEventListener("click", function(e) {
		typeset("#mathjax-test", "$$\\frac{a^3}{1-a^2}$$");
	});
	// testButton.hidden = false;
}
