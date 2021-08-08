"use strict";

const frameMargin = 0.10;
var inputSamples = [];

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
function resize(canvas, strokes) {
	let box = boundingBox(strokes);
	if (! box) {
		return [];
	}

	let boxWidth = box.xMax - box.xMin, boxHeight = box.yMax - box.yMin;
	let canvasDim = Math.min(canvas.width, canvas.height), boxDim = Math.max(boxWidth, boxHeight);
	let scale = (1. - 2. * frameMargin) * canvasDim / boxDim;
	let offsetX = scale * ((boxDim - boxWidth) / 2. - box.xMin) + (canvas.width - canvasDim) / 2. + frameMargin * canvasDim;
	let offsetY = scale * ((boxDim - boxHeight) / 2. - box.yMin) + (canvas.height - canvasDim) / 2. + frameMargin * canvasDim;
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

function createSample(rank, unicode, symbol_class, strokes) {
	if (strokes.length === 0) {
		return null;
	}
	let sample = {};
	sample.dataset_id = rank;
	sample.unicode = unicode;
	sample.symbol_class = symbol_class;
	sample.totalDotsNumber = 0;
	sample.strokes = strokes;
	for (let i = 0; i < strokes.length; ++i) {
		sample.totalDotsNumber += strokes[i].length;
	}
	return sample;
}

function submitSample(unicode, symbol_class) {
	if (inputStrokes.length === 0) {
		alert("Nothing to submit.");
		return;
	}
	let sample = createSample(inputSamples.length, unicode, symbol_class, resize(inputCanvas, inputStrokes));
	if (sample) {
		inputSamples.push(sample);
		clearInputs(inputCanvas);
		$('#savedSamplesCount').html("Saved samples count: " + inputSamples.length +
			"<br>Click on Inspect to see them.");
	} // else, skipping this sample.
}

function createOutput(samples) {
	let output = {};
	output.version = "1.0.0";
	output.description = "Each sample contains some metadata, and a list of strokes."
	output.description += " Each stroke is a list of dots, of the form {x: 50, y: 60, time: 1620256003707};"
	output.description += " where 0 <= x <= frameWidth, 0 <= y <= frameHeight, and 'time' is the UNIX time.";
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
// in case it changes with each user. On the other hand, this implies that input must be resized
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
