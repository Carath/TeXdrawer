"use strict";

const frameMargin = 0.05;
var inputSymbols = [];

function boundingBox(strokes) {
	if (strokes.length == 0 || strokes[0].length == 0) {
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
function resize(strokes) {
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

function createSymbol(rank, unicode, latex_command, strokes) {
	if (strokes.length == 0) {
		return null;
	}
	let symbol = {};
	symbol.rank = rank;
	symbol.unicode = unicode;
	symbol.latex_command = latex_command;
	symbol.totalSamplesNumber = 0;
	symbol.strokes = strokes;
	for (let i = 0; i < strokes.length; ++i) {
		symbol.totalSamplesNumber += strokes[i].length;
	}
	return symbol;
}

function submitSymbol() {
	// TODO: fetch symbol unicode and latex command:
	let symbol = createSymbol(inputSymbols.length, "null", "null", resize(inputStrokes));
	if (symbol) {
		inputSymbols.push(symbol);
		clearInputs();
		$('#stats').html("Saved symbols count: " + inputSymbols.length);
	} // else, skipping this symbol.
}

function createOutput(symbols) {
	let output = {};
	output.version = "1.0.0";
	output.description = "Each symbol is represented by its metadata, and a list of strokes."
	output.description += " Each stroke is a list of dots, of the form {x: 50, y: 60, time: 1620256003707};"
	output.description += " where 0 <= x <= frameWidth, 0 <= y <= frameHeight, and 'time' is the UNIX time.";
	output.inputLib = "plain-js"; // library used in inputs.js
	output.preprocessing = "resized";
	output.frameWidth = canvas.width; // used to save input precision, and for compatibility.
	output.frameHeight = canvas.height; // same.
	output.frameMargin = frameMargin;
	output.symbolsNumber = symbols.length;
	output.symbols = symbols;
	return output;
}

// Note: canvas.width and canvas.height are saved in the output format. This done both to
// not hardcode the maximum precision of the input, and to be able to retrieve said precision
// in case it changes with each user. On the other hand, this implies that input must be resized
// (and centered) to fit well in the canvas.
function save() {
	if (inputSymbols.length == 0) {
		alert("Nothing to save.");
		return;
	}

	let output = createOutput(inputSymbols);
	let jsonOutput = JSON.stringify(output);
	// console.log("jsonOutput:", jsonOutput);
	let filename = "output-" + timestamp() + ".json";
	download(jsonOutput, filename, "text/plain");
	// Cleanup, without emptying 'inputSymbols':
	clearInputs();
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
