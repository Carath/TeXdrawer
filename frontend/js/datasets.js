"use strict";

function boundingBox(strokes) {
	if (strokes.length == 0 || strokes[0].length == 0) {
		console.log("Cannot find the bounding box without strokes!");
		return null;
	}

	// Starting from the first dot of the first stroke, which must exist:
	let box = {
		xMin: strokes[0][0][0], xMax: strokes[0][0][0],
		yMin: strokes[0][0][1], yMax: strokes[0][0][1]
	};

	for (let i = 0; i < strokes.length; ++i) {
		for (let j = 0; j < strokes[i].length; ++j) {
			let x = strokes[i][j][0], y = strokes[i][j][1];
			box.xMin = x < box.xMin ? x : box.xMin;
			box.xMax = x > box.xMax ? x : box.xMax;
			box.yMin = y < box.yMin ? y : box.yMin;
			box.yMax = y > box.yMax ? y : box.yMax;
		}
	}
	return box;
}

// Resizing and centering the strokes, with integer coords:
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
			stroke.push([
				Math.round(scale * strokes[i][j][0] + offsetX),
				Math.round(scale * strokes[i][j][1] + offsetY)
			]);
		}
		newStrokes.push(stroke);
	}
	return newStrokes;
}

function createSymbol(metadata, strokes) {
	if (strokes.length == 0) {
		return null;
	}
	let symbol = {};
	symbol.metadata = "metadata";
	symbol.totalSamplesNumber = 0;
	symbol.strokes = strokes;
	for (let i = 0; i < strokes.length; ++i) {
		symbol.totalSamplesNumber += strokes[i].length;
	}
	return symbol;
}

function submitSymbol() {
	let resized = resize(inputStrokes);
	let symbol = createSymbol("metadata", resized); // TODO: use real metadata.
	if (symbol) {
		inputSymbols.push(symbol);
		clearInputs();
		stats.textContent = "Saved symbols count: " + inputSymbols.length;
	} // else, skipping this symbol.
}

function createOutput(symbols) {
	let output = {};
	output.version = "1.0.0";
	output.description = "Each symbol is represented by its metadata, and a list of strokes."
	output.description += " Each stroke is a list of [x, y] integer coordinates,"
	output.description += " with 0 <= x <= frameWidth and 0 <= y <= frameHeight";
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

	// Cleanup:
	let stats = document.getElementById("stats");
	stats.textContent = "";
	inputSymbols = [];
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
