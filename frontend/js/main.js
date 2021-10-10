"use strict";

// Settings:
const lineThickness = 6;
const samplesSize = 3;
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";
const cellSize = 4.; // in ex
const shownSymbolSize = 6.; // in ex

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

				// Preventing the symbol to grow... Still BUGGED!
				// size shrinks a bit... (e.g with U+221)
				$("#symbol-result").css({fontSize: 20});
				// $("#symbol-result").css("font-size", "20px");
				// $("#symbol-result")[0].style.fontSize="20px";

				drawSample("#symbol-result", sample, shownSymbolSize);
				$("#symbol-result-sentence, #symbol-result").show();

				// resizing has some serious issues here...
				// drawSample("#wannabeSample", {symbol: ",", unicode: ""}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\Lambda", unicode: ""}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\jhvtvfgvg", unicode: "U+39B"}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\jhvtvfgvg", unicode: "U+7D"}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\jhvtvfgvg", unicode: "hello"}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\sum", unicode: ""}, shownSymbolSize);
				// drawSample("#wannabeSample", {symbol: "\\Sigma", unicode: ""}, shownSymbolSize);
			}
		});
	});
}
