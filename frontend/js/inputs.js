// Note: drawing outside the frame should be permitted (in case the user
// goes slightly beyond the border). However, samplings should be recentered,
// and rescaled as to be homogeneous.

"use strict";

var inputStrokes = [];
var currentStroke = [];
var currCoord = {};

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
	drawDot(canvas, currCoord, lineThickness / 2, drawingColor);
	saveCoord();

	function drawStrokeAction(event) {
		drawCurrentStroke(canvas, event);
	};

	function stopInputs() {
		document.removeEventListener("mousemove", drawStrokeAction);
		if (currentStroke.length > 0) {
			inputStrokes.push(currentStroke);
			currentStroke = [];
			// console.log("inputStrokes:", inputStrokes);
		}
	}

	document.addEventListener("mousemove", drawStrokeAction);
	document.addEventListener("mouseup", stopInputs);
}

function updateCurrentCoord(canvas, event) {
	// Using getBoundingClientRect() instead of canvas.offsetLeft/offsetTop,
	// in case the page is scrolled down (e.g when zoomed).
	let bounds = canvas.getBoundingClientRect();
	currCoord.x = event.clientX - bounds.left;
	currCoord.y = event.clientY - bounds.top;
}

function isInCanvas(canvas, coord) {
	return coord.x >= 0 && coord.x <= canvas.width &&
		coord.y >= 0 && coord.y <= canvas.height;
}

function saveCoord() {
	if (allowTimeReshifting && timeOffset === 0) {
		timeOffset = new Date().getTime(); // UNIX time
	}
	currentStroke.push({
		x: Math.round(currCoord.x),
		y: Math.round(currCoord.y),
		time: new Date().getTime() - timeOffset
	});
}

function drawCurrentStroke(canvas, event) {
	const ctx = canvas.getContext("2d");
	ctx.lineWidth = lineThickness;
	ctx.strokeStyle = drawingColor;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(currCoord.x, currCoord.y);
	updateCurrentCoord(canvas, event);
	ctx.lineTo(currCoord.x, currCoord.y);
	ctx.stroke();
	saveCoord();
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

function clearCanvas(canvas) {
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function clearInputs(canvas) {
	clearCanvas(canvas);
	inputStrokes = [];
	currentStroke = [];
	currCoord = [];
	timeOffset = 0; // resetting the time for each symbol.
	dotsShown = false;
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
