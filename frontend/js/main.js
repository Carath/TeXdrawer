"use strict";

// Settings:
const lineThickness = 6; // in px
const samplesSize = 3; // in px
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";
const cellSize = 42.; // in px
const shownSymbolSize = 50.; // in px

var inputCanvas = null;
var dotsShown = false;
var wannabeSamplesList = [];
var currentWannabeSample = {};

// Set the size of the canvas bitmap as its css size, and return it as DOM object:
function getFixedCanvas(canvasSelector) {
	let canvas = $(canvasSelector);
	canvas[0].width = canvas.width();
	canvas[0].height = canvas.height();
	return canvas[0];
}

window.onload = function() {

	loadWannabeSamples(symbolsDatasetCreation, categoriesBlacklist);

	inputCanvas = getFixedCanvas("#input-canvas");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	inputCanvas.addEventListener("mousedown", function(event) {
		startInputs(inputCanvas, event);
	});

	$("#clearButton").click(function(event) {
		clearInputs(inputCanvas);
	});

	$("#classifyButton").click(function(event) {
		// console.log("inputStrokes:", JSON.stringify(inputStrokes));
		classifyRequest(serviceChoice.value, mappingChoice.value, inputStrokes); // sending raw inputs.
	});

	$("#showSymbolsButton").click(function(event) {
		symbolsRequest(serviceChoice.value, mappingChoice.value);
		clearInputs(inputCanvas);
	});

	$("#showDotsButton").click(function(event) { // for testing purposes
		showDots();
	});

	$("#submitButton").click(function(event) {
		if (submitWannabeSample(currentWannabeSample)) {
			lockedWannabeSample = false;
			nextDrawableSample();
		}
	});

	$("#exportButton").click(function(event) {
		saveSamples();
	});

	$("#sidenav-about").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#grid-container, #classify-draw").hide();
		$("#about").show();
		$("#classification-results").empty();
		clearInputs(inputCanvas);
	});

	$("#sidenav-classify").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #exportButton, #submitButton, #showDotsButton").hide();
		$("#savedSamplesCount, #symbol-area, #wannabeSample").hide();
		$("#classify-draw, #center-area, #showSymbolsButton, #classifyButton, #service-area").show();
		$("#classification-results").empty();
		$("#usage").html("Trying out self hosted classification services:");
		clearInputs(inputCanvas);
		servicesAndMappingsRequest();
	});

	$("#sidenav-draw").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #showSymbolsButton, #classifyButton, #service-area, #symbol-area").hide();
		$("#classify-draw, #center-area, #exportButton, #submitButton").show();
		$("#showDotsButton, #savedSamplesCount, #wannabeSample").show();
		$("#classification-results").empty();
		$("#usage").html("Dataset creation tool. Please draw the symbol:");
		clearInputs(inputCanvas);
		nextDrawableSample();
	});

	$("#sidenav-inspect").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #classify-draw").hide();
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

	$("#sidenav-symbol").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #center-area, #symbol-result-sentence, #symbol-result").hide();
		$("#classify-draw, #symbol-area").show();
		$("#classification-results").empty();
		clearInputs(inputCanvas);

		let textInputContent = $("#symbol-input")[0];
		textInputContent.value = "";

		$("#symbol-instruction").html("Type a latex command or unicode here:");

		$("#symbolButton").click(function(event) { // replace this with an input listener?
		// $("#symbol-input").on("input", function(event) {
			if (textInputContent.value !== "") {
				let sample = {symbol: textInputContent.value};
				if (textInputContent.value.substring(0, 2) === "U+") {
					sample = {unicode: textInputContent.value};
				}
				drawSample("#symbol-result", sample, shownSymbolSize);
				$("#symbol-result-sentence, #symbol-result").show();
			}
		});
	});
}
