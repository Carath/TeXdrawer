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
const maxDrawnSamples = 20;
const mockSamplesNumber = 30;

var unsavedData = false;
var inputCanvas = null;
var dotsShown = false;
var datasetCategories = [];
var wannabeSamplesList = [];
var currentWannabeSample = {};
var inputSamples = [];
var loadedSamples = [];
var drawnSamples = [];
var startShownCells = 0;
var currInspCtxt = "Mock"; // For testing, will be initialized to "" eventually.
// All Inspector contexts: "Mock", "Submitted", "Loaded", "Dataset".
var currDataName = "default"; // Used to discriminate selections from different files or datasets.

// This message may be overriden by the browser upon quitting:
const confirmationMessage = "Some unsaved samples will be lost unless exported, are you sure you want to proceed?";


// Set the size of the canvas bitmap as its css size, and return it as DOM object:
function getFixedCanvas(canvasSelector) {
	let canvas = $(canvasSelector);
	canvas[0].width = canvas.width();
	canvas[0].height = canvas.height();
	return canvas[0];
}

window.onload = function() {

	window.addEventListener("beforeunload", function(event) { // upon quitting
		if (!unsavedData)
			return;
		(event || window.event).returnValue = confirmationMessage;
		return confirmationMessage;
	});

	loadWannabeSamples(symbolsDatasetCreation, categoriesBlacklist);

	inputCanvas = getFixedCanvas("#input-canvas");

	// Prevent scrolling when touching the canvas:
	document.body.addEventListener("touchstart", function(event) {
		if (event.target === inputCanvas) {
			event.preventDefault();
		}
	}, {passive: false});
	document.body.addEventListener("touchend", function(event) {
		if (event.target === inputCanvas) {
			event.preventDefault();
		}
	}, {passive: false});
	document.body.addEventListener("touchmove", function(event) {
		if (event.target === inputCanvas) {
			event.preventDefault();
		}
	}, {passive: false});

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	inputCanvas.addEventListener("mousedown", function(event) {
		startInputs(inputCanvas, event);
	});
	inputCanvas.addEventListener("touchstart", function(event) {
		startInputs(inputCanvas, event);
	});

	const fileInput = $("#submit-file");
	fileInput[0].value = "";

	fileInput.click(function(event) {
		if (unsavedData && ! confirm(confirmationMessage)) {
			event.preventDefault(); // preventing to load a file when input data isn't saved.
		}
	});

	fileInput.change(function(event) {
		unsavedData = false;
		loadFile(fileInput);
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
			currInspCtxt = "Submitted";
			currDataName = "default";
			lockedWannabeSample = false;
			unsavedData = true;
			nextDrawableSample();
		}
	});

	$("#exportButton").click(function(event) {
		if (currInspCtxt === "Submitted" || currInspCtxt === "Loaded") {
			unsavedData = false;
			saveSamples();
		}
		else {
			alert("This data cannot be exported.");
		}
	});

	$("#backwardButton").click(function(event) {
		startShownCells -= maxDrawnSamples;
		if (startShownCells < 0) {
			let chunkIndex = Math.max(0, Math.ceil(drawnSamples.length / maxDrawnSamples - 1));
			startShownCells = maxDrawnSamples * chunkIndex;
		}
		drawCellsChunk(drawnSamples, currInspCtxt, currDataName);
	});

	$("#forwardButton").click(function(event) {
		startShownCells += maxDrawnSamples;
		if (startShownCells >= drawnSamples.length) {
			startShownCells = 0;
		}
		drawCellsChunk(drawnSamples, currInspCtxt, currDataName);
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

	$("#sidenav-symbol").click(function(event) {
		$(this).addClass("active").siblings().removeClass("active");
		$("#about, #grid-container, #center-area, #symbol-result-area").hide();
		$("#classify-draw, #symbol-area").show();
		$("#classification-results").empty();
		clearInputs(inputCanvas);

		let textInputContent = $("#symbol-input")[0];
		textInputContent.value = "";
		$("#symbol-instruction").html("Type a latex command or unicode here:");

		function drawInputSymbol() {
			if (textInputContent.value === "") {
				$("#symbol-result-area").hide();
			}
			else {
				let sample = {symbol: textInputContent.value};
				if (textInputContent.value.substring(0, 2) === "U+") {
					sample = {unicode: textInputContent.value};
				}
				drawSample("#symbol-result", sample, shownSymbolSize);
				$("#symbol-result-area").show();
			}
		};

		$("#symbolButton").click(function(event) {
			drawInputSymbol();
		});

		$("#symbol-input").on("keyup", function (e) {
			if (e.key === "Enter" || e.keyCode === 13) {
				drawInputSymbol();
			}
		});
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

		if (currInspCtxt === "Submitted" && inputSamples.length > 0) {
			drawnSamples = inputSamples;
			fileInput[0].value = "";
		}
		else if (currInspCtxt === "Loaded" && loadedSamples.length > 0) {
			drawnSamples = loadedSamples;
		}
		else if (currInspCtxt === "Mock") {
			drawnSamples = generateMockSamples(mockSamplesNumber);
		}
		else if (currInspCtxt === "Dataset") {
			alert("'dataset' inspector context not supported yet.");
			drawnSamples = [];
		}
		else {
			alert("Insupported inspector context: " + currInspCtxt);
			drawnSamples = [];
		}
		startShownCells = 0;
		drawCellsChunk(drawnSamples, currInspCtxt, currDataName);
		updateSamplesMessage();
	});
}
