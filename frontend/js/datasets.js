"use strict";

const datasetFormatVersion = "1.0.0";
const frameMargin = 0.10; // should be between 0. and 0.5

function boundingBox(strokes) {
	if (strokes.length === 0 || strokes[0].length === 0) {
		console.log("Cannot find the bounding box without strokes!");
		return null;
	}

	// Starting from the first dot of the first stroke, which must exist:
	let box = {
		xMin: strokes[0][0].x, xMax: strokes[0][0].x,
		yMin: strokes[0][0].y, yMax: strokes[0][0].y
	};

	for (let i = 0; i < strokes.length; ++i) {
		for (let j = 0; j < strokes[i].length; ++j) {
			let x = strokes[i][j].x, y = strokes[i][j].y;
			box.xMin = x < box.xMin ? x : box.xMin;
			box.xMax = x > box.xMax ? x : box.xMax;
			box.yMin = y < box.yMin ? y : box.yMin;
			box.yMax = y > box.yMax ? y : box.yMax;
		}
	}
	return box;
}

// Returns new strokes, resized and recentered, with integer coords:
function resizeStrokes(canvas, strokes) {
	let box = boundingBox(strokes);
	if (! box) {
		return [];
	}

	let boxWidth = box.xMax - box.xMin, boxHeight = box.yMax - box.yMin;
	let canvasDim = Math.min(canvas.width, canvas.height), boxDim = Math.max(boxWidth, boxHeight);
	let scale = boxDim === 0 ? 1.0 : (1. - 2. * frameMargin) * canvasDim / boxDim;
	let offsetX = (canvas.width - scale * (box.xMin + box.xMax)) / 2.;
	let offsetY = (canvas.height - scale * (box.yMin + box.yMax)) / 2.;
	let newStrokes = [];

	for (let i = 0; i < strokes.length; ++i) {
		let stroke = [];
		for (let j = 0; j < strokes[i].length; ++j) {
			stroke.push({
				x: Math.round(scale * strokes[i][j].x + offsetX),
				y: Math.round(scale * strokes[i][j].y + offsetY),
				time: strokes[i][j].time
			});
		}
		newStrokes.push(stroke);
	}
	return newStrokes;
}

function showDots() {
	if (inputStrokes.length === 0) {
		alert("No strokes given, no samples to show.");
		return;
	}
	if (dotsShown) {
		clearCanvas(inputCanvas);
		drawStrokes(inputCanvas, inputStrokes, drawingColor);
	}
	else {
		console.log("inputStrokes:", JSON.stringify(inputStrokes));
		let resized = resizeStrokes(inputCanvas, inputStrokes);
		showSamples(inputCanvas, inputStrokes, [samplesColor]);
		showSamples(inputCanvas, resized, [rescaledSamplesColor]);
	}
	dotsShown = !dotsShown;
}

function createSample(dataset_id, wannabeSample, strokes) {
	let sample = {};
	sample.dataset_id = dataset_id;
	sample.symbol = wannabeSample.symbol;
	sample.unicode = wannabeSample.unicode;
	sample.totalDotsNumber = 0;
	sample.strokes = strokes;
	for (let i = 0; i < strokes.length; ++i) {
		sample.totalDotsNumber += strokes[i].length;
	}
	return sample;
}

function submitWannabeSample(wannabeSample) {
	if (inputStrokes.length === 0) {
		alert("Nothing to submit.");
		return false;
	}
	let resized = resizeStrokes(inputCanvas, inputStrokes);
	let sample = createSample(inputSamples.length, wannabeSample, resized);
	inputSamples.push(sample);
	clearInputs(inputCanvas);
	$('#savedSamplesCount').html("Saved samples count: <strong>" + inputSamples.length +
		"</strong><br>Click on Inspect to see them.");
	return true;
}

function createOutput(samples) {
	let output = {};
	output.version = datasetFormatVersion;
	output.description = "Each sample contains some metadata, and a list of strokes. Each stroke is a list of dots,"
	output.description += " of the form {x: 50, y: 60, time: 1620256003707}; where 0 <= x <= frameWidth,"
	output.description += " 0 <= y <= frameHeight, and 'time' is the UNIX time, potentially shifted.";
	output.inputLib = "plain-js"; // library used in inputs.js
	output.preprocessing = "resized";
	output.frameWidth = inputCanvas.width; // used to save input precision, and for compatibility.
	output.frameHeight = inputCanvas.height; // same.
	output.frameMargin = frameMargin;
	output.samplesNumber = samples.length;
	output.samples = samples;
	return output;
}

// Note: inputCanvas width and height are saved in the output format. This is done both to not
// hardcode the maximum precision of the input, and to be able to retrieve said precision
// in case it changes with each user. On the other hand, this implies that inputs must be resized
// (and centered) to fit well in the canvas.
function saveSamples() {
	if (inputSamples.length === 0) {
		alert("Nothing to export.");
		return;
	}
	let output = createOutput(inputSamples);
	let jsonOutput = JSON.stringify(output);
	// console.log("jsonOutput:", jsonOutput);
	let filename = "output-" + timestamp() + ".json";
	download(jsonOutput, filename, "text/plain");
	// Cleanup, without emptying 'inputSamples':
	clearInputs(inputCanvas);
}

function download(content, filename, contentType) {
	let a = document.createElement("a");
	let file = new Blob([content], {type: contentType});
	a.href = URL.createObjectURL(file);
	a.download = filename;
	a.click();
}

function addLeadingZeros(num, size) {
	return num.toString().padStart(size, "0");
}

// Returns the locale date with format "yyyy-mm-dd-hh-mm-ss"
function timestamp() {
	let d = new Date(), ts = "";
	ts += d.getFullYear();
	ts += "-" + addLeadingZeros(d.getMonth()+1, 2); // months start at 0.
	ts += "-" + addLeadingZeros(d.getDate(), 2);
	ts += "-" + addLeadingZeros(d.getHours(), 2);
	ts += "-" + addLeadingZeros(d.getMinutes(), 2);
	ts += "-" + addLeadingZeros(d.getSeconds(), 2);
	return ts;
}

function loadFile(fileInput) {
	if (! window.FileReader) {
		alert("FileReader not supported by this browser.");
		return;
	}
	let files = fileInput[0].files;
	let reader = new FileReader();
	if (files.length) {
		let textFile = files[0];
		reader.readAsText(textFile);
		$(reader).on("load", processLoadedFile);
	} else {
		alert("Please upload a file before continuing.");
	}
}

function processLoadedFile(event) {
	let fileContent = event.target.result;
	if (fileContent && fileContent.length) {
		// console.log(fileContent);
		try {
			let jsonObj = JSON.parse(fileContent);
			// console.log(jsonObj);
			if (validateLoadedFile(jsonObj)) {
				$("#samples-message").html("Loaded samples:");
				lastSamplesState = "loaded";
				loadedSamples = jsonObj["samples"];
				drawnSamples = loadedSamples;
				startShownCells = 0;
				drawCellsChunk(drawnSamples);
			}
			else {
				alert("Unsupported loaded file content.");
			}
		} catch (error) {
			alert("Loaded file must be in JSON format.");
		}
	}
}

// Only checks if the file looks valid, by looking at first order fields.
function validateLoadedFile(jsonObj) {
	let version = "version" in jsonObj ? jsonObj["version"] : "";
	if (version !== datasetFormatVersion) {
		console.log("Incompatible dataset versions:", version, "vs", datasetFormatVersion);
		return false;
	}
	if (! ("samples" in jsonObj) || jsonObj["samples"].length === 0) {
		console.log("No samples found in the loaded file.");
		return false;
	}
	return true;
}
