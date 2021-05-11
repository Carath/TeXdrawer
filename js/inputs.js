// Note: drawing outside the frame should be permitted (in case the user
// goes slightly beyond the border). However, samplings should be recentered,
// and rescaled as to be homogeneous.

"use strict";

var inputSymbols = [];
var inputStrokes = [];
var currentStroke = [];
var currCoord = [];

function startInputs(event) {
	document.addEventListener("mouseup", stopInputs);
	document.addEventListener("mousemove", drawStroke);
	updateCurrentCoord(event);
	drawDot(currCoord, lineThickness / 2, drawingColor);
	saveCoord();
}

function stopInputs() {
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
