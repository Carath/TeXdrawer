"use strict";

// Settings:
const lineThickness = 6;
const samplesSize = 3;
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";
const cellSize = 4.; // in ex

var canvas = null;
var ctx = null;

window.onload = function() {
	canvas = document.getElementById("input-canvas");
	ctx = canvas.getContext("2d");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	canvas.addEventListener("mousedown", startInputs);

	$("#exportButton").click(function(e) {
		save();
	});

	$("#retryButton").click(function(e) {
		clearInputs();
	});

	$("#submitButton").click(function(e) {
		submitSymbol();
	});

	$("#showSamplesButton").click(function(e) { // for testing purposes
		if (inputStrokes.length === 0) {
			alert("No strokes given, no samples to show.");
			return;
		}
		console.log("inputStrokes:", JSON.stringify(inputStrokes));
		let resized = resize(inputStrokes);
		showSamples(inputStrokes, samplesColor);
		showSamples(resized, rescaledSamplesColor);
	});

	$("#classifyButton").click(function(e) {
		// console.log("inputStrokes:", JSON.stringify(inputStrokes));
		classifyRequest(serviceChoice.value, mappingChoice.value, inputStrokes); // sending raw inputs.
	});

	$("#symbolsButton").click(function(e) {
		symbolsRequest(serviceChoice.value, mappingChoice.value);
		clearInputs();
	});

	// $("#testButton").click(function(e) {
	// 	typeset("#mathjax-test", "$$\\frac{a^3}{1-a^2}$$");
	// });
	// testButton.hidden = false;

	$("#sidenav-about").click(function(e) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#grid-container, #classify-draw, #right-side").hide();
		$("#about").show();
		$("#classification-results").empty();
		clearInputs();
	});

	$("#sidenav-classify").click(function(e) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #exportButton, #submitButton, #showSamplesButton").hide();
		$("#classify-draw, #right-side, #classifyButton, #symbolsButton, #serviceArea").show();
		$("#classification-results").empty();
		$("#usage").html("Trying out some classification services (self hosted):");
		$("#stats").html("");
		clearInputs();
		servicesAndMappingsRequest();
	});

	$("#sidenav-draw").click(function(e) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #classifyButton, #symbolsButton, #serviceArea").hide();
		$("#classify-draw, #right-side, #exportButton, #submitButton, #showSamplesButton").show();
		$("#classification-results").empty();
		$("#usage").html("Dataset creation tool:");
		$("#stats").html("");
		clearInputs();
	});

	$("#sidenav-inspect").click(function(e) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #classify-draw, #right-side").hide();
		$("#grid-container").show();
		$("#classification-results").empty();
		clearInputs();
		addAllCells(exampleCells());
	});
}
