// Note: drawing outside the frame should be permitted (in case the user
// goes slightly beyond the border). However, samplings should be recentered,
// and rescaled as to be homogeneous.

"use strict";

window.onload = function() {
	// Settings:
	const borderRatio = 0.05; // param which must be a metadata, as long with width / height (unless in unit square).

	var lineThickness = 6;
	var samplesSize = 3;
	var samplesOpacity = 0.5;
	var drawingColor = "orange";
	var samplesColor = "green";
	var rescaledSamplesColor = "red";

	var inputSymbols = [];
	var inputStrokes = [];
	var currentStroke = [];
	var currCoord = [];

	const canvas = document.getElementById("myCanvas");
	const ctx = canvas.getContext("2d");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	canvas.addEventListener("mousedown", start);

	var exportButton = document.getElementById("exportButton");
	exportButton.addEventListener("click", function(e) {
		save();
	});

	var retryButton = document.getElementById("retryButton");
	retryButton.addEventListener("click", function(e) {
		clearInputs();
	});

	var nextButton = document.getElementById("nextButton");
	nextButton.addEventListener("click", function(e) {
		let resized = resize(inputStrokes);
		let symbol = createSymbol("metadata", resized); // TODO: use real metadata.
		if (symbol != null) {
			inputSymbols.push(symbol);
			clearInputs();
			stats.textContent = "Saved symbols count: " + inputSymbols.length;
		} // else, skipping this symbol.
	});

	var showSamplesButton = document.getElementById("showSamplesButton");
	showSamplesButton.addEventListener("click", function(e) {
		let resized = resize(inputStrokes);
		showSamples(inputStrokes, samplesColor);
		showSamples(resized, rescaledSamplesColor);
	});

	var stats = document.getElementById("stats");
	stats.textContent = "";


	function start(event) {
		document.addEventListener("mouseup", stop);
		document.addEventListener("mousemove", drawStroke);
		updateCurrentCoord(event);
		drawDot(currCoord, lineThickness / 2, drawingColor);
		saveCoord();
	}

	function stop() {
		document.removeEventListener("mousemove", drawStroke);
		if (currentStroke.length > 0) {
			inputStrokes.push(currentStroke);
			currentStroke = [];
			console.log("inputStrokes:", inputStrokes);
		}
	}

	function updateCurrentCoord(event) {
		// Using getBoundingClientRect() instead of canvas.offsetLeft/offsetTop,
		// in case the page is scrolled down (e.g when zoomed).
		let bounds = canvas.getBoundingClientRect();
		currCoord[0] = event.clientX - bounds.left;
		currCoord[1] = event.clientY - bounds.top;
	}

	function isInCanvas(coord) {
		return coord[0] >= 0 && coord[0] <= canvas.width &&
			coord[1] >= 0 && coord[1] <= canvas.height;
	}

	function saveCoord() {
		currentStroke.push([
			currCoord[0],
			currCoord[1]
		]);
	}

	function drawStroke(event) {
		ctx.beginPath();
		ctx.lineWidth = lineThickness;
		ctx.lineCap = "round";
		ctx.strokeStyle = drawingColor;
		ctx.moveTo(currCoord[0], currCoord[1]);
		updateCurrentCoord(event);
		ctx.lineTo(currCoord[0], currCoord[1]);
		ctx.stroke();
		saveCoord();
	}

	function drawDot(dot, size, color) {
		ctx.beginPath();
		ctx.arc(dot[0], dot[1], size, 0, 2. * Math.PI, false);
		ctx.fillStyle = color; // center
		ctx.fill();
		ctx.lineWidth = 1;
		ctx.strokeStyle = color;
		ctx.stroke();
	}

	function clearInputs() {
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		inputStrokes = [];
		currentStroke = [];
		currCoord = [];
	}

	function showSamples(strokes, color) {
		// clearInputs();
		ctx.globalAlpha = samplesOpacity;
		for (let i = 0; i < strokes.length; ++i) {
			console.log("strokes["+i+"]:", strokes[i]);
			for (let j = 0; j < strokes[i].length; ++j) {
				drawDot(strokes[i][j], samplesSize, color);
			}
		}
		ctx.globalAlpha = 1.0;
	}

	function boundingBox(strokes) {
		if (strokes.length == 0) {
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
		if (box == null) {
			return [];
		}

		let boxWidth = box.xMax - box.xMin, boxHeight = box.yMax - box.yMin;
		let canvasDim = Math.min(canvas.width, canvas.height), boxDim = Math.max(boxWidth, boxHeight);
		let scale = (1. - 2. * borderRatio) * canvasDim / boxDim;
		let offsetX = scale * ((boxDim - boxWidth) / 2. - box.xMin) + (canvas.width - canvasDim) / 2. + borderRatio * canvasDim;
		let offsetY = scale * ((boxDim - boxHeight) / 2. - box.yMin) + (canvas.height - canvasDim) / 2. + borderRatio * canvasDim;
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

	// Note: canvas.width and canvas.height are saved in the output format. This done both to
	// not hardcode the maximum precision of the input, and to be able to retrieve said precision
	// in case it changes with each user. On the other hand, this implies that input must be resized
	// (and centered) to fit well in the canvas.
	function save() {
		if (inputSymbols.length == 0) {
			console.log("Nothing to save.");
			return;
		}

		let output = {};
		output.version = "1.0.0";
		output.description = "Each symbol is represented by its metadata, and a list of strokes."
		output.description += " Each stroke is a list of [x, y] integer coordinates,"
		output.description += " with 0 <= x <= frameWidth and 0 <= y <= frameHeight";
		output.frameWidth = canvas.width; // used to save input precision, and for compatibility.
		output.frameHeight = canvas.height; // same.
		// output.maxStrokeSize = 128;
		output.symbolsNumber = inputSymbols.length;
		output.symbols = inputSymbols;

		// let lastStrokes = inputSymbols[inputSymbols.length - 1].strokes;
		// console.log("lastStrokes:", lastStrokes);
		clearInputs();
		// showSamples(lastStrokes, "lightgreen"); // for testing purposes.

		let jsonOutput = JSON.stringify(output);
		// console.log("jsonOutput:", jsonOutput);
		let filename = "output-" + timestamp() + ".json";
		download(jsonOutput, filename, "text/plain");

		// Cleanup:
		inputSymbols = [];
		stats.textContent = "";
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
}
