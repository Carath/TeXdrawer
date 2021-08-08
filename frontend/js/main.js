"use strict";

// Settings:
const lineThickness = 6;
const samplesSize = 3;
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";
const cellSize = 4.; // in ex

var inputCanvas = null;

// Set the size of the canvas bitmap as its css size, and return it as DOM object:
function getFixedCanvas(canvasSelector) {
	let canvas = $(canvasSelector);
	canvas[0].width = canvas.width();
	canvas[0].height = canvas.height();
	return canvas[0];
}

window.onload = function() {
	inputCanvas = getFixedCanvas("#input-canvas");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	inputCanvas.addEventListener("mousedown", function(event) {
		startInputs(inputCanvas, event);
	});

	$("#exportButton").click(function(event) {
		saveSamples();
	});

	$("#clearButton").click(function(event) {
		clearInputs(inputCanvas);
	});

	$("#submitButton").click(function(event) {
		// TODO: add sample unicode and latex command:
		submitSample("", "");
	});

	$("#showSamplesButton").click(function(event) { // for testing purposes
		if (inputStrokes.length === 0) {
			alert("No strokes given, no samples to show.");
			return;
		}
		console.log("inputStrokes:", JSON.stringify(inputStrokes));
		let resized = resize(inputCanvas, inputStrokes);
		showSamples(inputCanvas, inputStrokes, [samplesColor]);
		showSamples(inputCanvas, resized, [rescaledSamplesColor]);
	});

	$("#classifyButton").click(function(event) {
		// console.log("inputStrokes:", JSON.stringify(inputStrokes));
		classifyRequest(serviceChoice.value, mappingChoice.value, inputStrokes); // sending raw inputs.
	});

	$("#showSymbolsButton").click(function(event) {
		symbolsRequest(serviceChoice.value, mappingChoice.value);
		clearInputs(inputCanvas);
	});

	// $("#testButton").click(function(event) {
	// 	typeset("#mathjax-test", "$$\\frac{a^3}{1-a^2}$$");
	// });
	// testButton.hidden = false;

	$("#sidenav-about").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#grid-container, #classify-draw, #right-side").hide();
		$("#about").show();
		$("#classification-results").empty();
		clearInputs(inputCanvas);
	});

	$("#sidenav-classify").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #exportButton, #submitButton, #showSamplesButton, #savedSamplesCount").hide();
		$("#classify-draw, #right-side, #showSymbolsButton, #classifyButton, #service-area").show();
		$("#classification-results").empty();
		$("#usage").html("Trying out some classification services (self hosted):");
		clearInputs(inputCanvas);
		servicesAndMappingsRequest();
	});

	$("#sidenav-draw").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #showSymbolsButton, #classifyButton, #service-area").hide();
		$("#classify-draw, #right-side, #exportButton, #submitButton, #showSamplesButton, #savedSamplesCount").show();
		$("#classification-results").empty();
		$("#usage").html("Dataset creation tool:");
		clearInputs(inputCanvas);
	});

	$("#sidenav-inspect").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #classify-draw, #right-side").hide();
		$("#grid-container").show();
		$("#classification-results").empty();
		clearInputs(inputCanvas);

		if (inputSamples.length === 0) {
			$("#samples-message").html("Mock data:");
			addAllCells(mockSamples());
		}
		else {
			$("#samples-message").html("Submitted samples:");
			addAllCells(inputSamples);
		}
	});
}
