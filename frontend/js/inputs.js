// Note: drawing outside the frame should be permitted (in case the user
// goes slightly beyond the border). However, samplings should be recentered,
// and rescaled as to be homogeneous.

"use strict";

const minStepSizeSquared = 25; // to prevent oversampled inputs.

var inputStrokes = []; // used by other scripts.
var _currentStroke = [];
var _currCoord = {};

// Used to reduce files size, without data loss:
const allowTimeReshifting = true;
var timeOffset = 0;

function startInputs(canvas, event) {
	if (dotsShown) {
		clearCanvas(canvas);
		drawStrokes(canvas, inputStrokes, drawingColor);
		dotsShown = false;
	}

	updateCurrentCoord(canvas, event);
	drawDot(canvas, _currCoord, lineThickness / 2, drawingColor);
	saveCurrentCoord();

	function drawUserAction(event) {
		continuePath(canvas, event);
	};

	function stopInputs() {
		document.removeEventListener("mousemove", drawUserAction);
		if (_currentStroke.length > 0) {
			inputStrokes.push(_currentStroke);
			_currentStroke = [];
			// console.log("inputStrokes:", inputStrokes);
		}
	};

	document.addEventListener("mousemove", drawUserAction);
	document.addEventListener("mouseup", stopInputs);
}

function updateCurrentCoord(canvas, event) {
	// Using getBoundingClientRect() instead of canvas.offsetLeft/offsetTop,
	// in case the page is scrolled down (e.g when zoomed).
	let bounds = canvas.getBoundingClientRect();
	_currCoord.x = event.clientX - bounds.left;
	_currCoord.y = event.clientY - bounds.top;
}

function saveCurrentCoord() {
	if (_currentStroke.length > 0) {
		let prevCoord = _currentStroke[_currentStroke.length - 1];
		let deltaX = _currCoord.x - prevCoord.x, deltaY = _currCoord.y - prevCoord.y;
		let distSquared = deltaX * deltaX + deltaY * deltaY;
		if (distSquared <= minStepSizeSquared) {
			// console.log("Too small a step, skipping!");
			return;
		}
	}

	if (allowTimeReshifting && timeOffset === 0) {
		timeOffset = new Date().getTime(); // UNIX time
	}
	_currentStroke.push({
		x: Math.round(_currCoord.x),
		y: Math.round(_currCoord.y),
		time: new Date().getTime() - timeOffset
	});
}

function isInCanvas(canvas, coord) {
	return coord.x >= 0 && coord.x <= canvas.width &&
		coord.y >= 0 && coord.y <= canvas.height;
}

function clearCanvas(canvas) {
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function clearInputs(canvas) {
	clearCanvas(canvas);
	inputStrokes = [];
	_currentStroke = [];
	_currCoord = [];
	timeOffset = 0; // resetting the time for each symbol.
	dotsShown = false;
}

function drawDot(canvas, dot, size, color) {
	const ctx = canvas.getContext("2d");
	ctx.lineWidth = 1;
	ctx.strokeStyle = color;
	ctx.fillStyle = color; // center
	ctx.beginPath();
	ctx.arc(dot.x, dot.y, size, 0, 2. * Math.PI, false);
	ctx.fill();
	ctx.stroke();
}

function continuePath(canvas, event) {
	const ctx = canvas.getContext("2d");
	ctx.lineWidth = lineThickness;
	ctx.strokeStyle = drawingColor;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(_currCoord.x, _currCoord.y);
	updateCurrentCoord(canvas, event);
	ctx.lineTo(_currCoord.x, _currCoord.y);
	ctx.stroke();
	saveCurrentCoord();
}

function drawStrokes(canvas, strokes, color) {
	const ctx = canvas.getContext("2d");
	for (let i = 0; i < strokes.length; ++i) {
		if (strokes[i].length === 0) {
			continue;
		}
		if (strokes[i].length === 1) {
			drawDot(canvas, strokes[i][0], samplesSize, color);
			continue;
		}

		// Resetting the context here!
		ctx.lineWidth = lineThickness;
		ctx.strokeStyle = color;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(strokes[i][0].x, strokes[i][0].y);
		for (let j = 1; j < strokes[i].length; ++j) {
			ctx.lineTo(strokes[i][j].x, strokes[i][j].y);
			ctx.stroke();
		}
	}
}

// Will draw each stroke with a different color, until no given color remains.
// In that case, the last one will continue to be used.
function showSamples(canvas, strokes, colors) {
	if (colors.length === 0) {
		console.log("Cannot show samples: no colors given.");
		return;
	}
	const ctx = canvas.getContext("2d");
	ctx.globalAlpha = samplesOpacity;
	for (let i = 0; i < strokes.length; ++i) {
		let color = colors[Math.min(i, colors.length - 1)];
		for (let j = 0; j < strokes[i].length; ++j) {
			drawDot(canvas, strokes[i][j], samplesSize, color);
		}
	}
	ctx.globalAlpha = 1.0;
}
