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
		// console.log("inputStrokes:", inputStrokes);
	}
}

function updateCurrentCoord(event) {
	// Using getBoundingClientRect() instead of canvas.offsetLeft/offsetTop,
	// in case the page is scrolled down (e.g when zoomed).
	let bounds = canvas.getBoundingClientRect();
	currCoord.x = event.clientX - bounds.left;
	currCoord.y = event.clientY - bounds.top;
}

function isInCanvas(coord) {
	return coord.x >= 0 && coord.x <= canvas.width &&
		coord.y >= 0 && coord.y <= canvas.height;
}

function saveCoord() {
	if (timeOffset == 0 && allowTimeReshifting) {
		timeOffset = new Date().getTime(); // UNIX time
	}
	currentStroke.push({
		x: Math.round(currCoord.x),
		y: Math.round(currCoord.y),
		time: new Date().getTime() - timeOffset
	});
}

function drawStroke(event) {
	ctx.beginPath();
	ctx.lineWidth = lineThickness;
	ctx.lineCap = "round";
	ctx.strokeStyle = drawingColor;
	ctx.moveTo(currCoord.x, currCoord.y);
	updateCurrentCoord(event);
	ctx.lineTo(currCoord.x, currCoord.y);
	ctx.stroke();
	saveCoord();
}

function drawDot(dot, size, color) {
	ctx.beginPath();
	ctx.arc(dot.x, dot.y, size, 0, 2. * Math.PI, false);
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
	timeOffset = 0; // resetting the time for each symbol.
}

function showSamples(strokes, color) {
	// clearInputs();
	ctx.globalAlpha = samplesOpacity;
	for (let i = 0; i < strokes.length; ++i) {
		// console.log("strokes["+i+"]:", strokes[i]);
		for (let j = 0; j < strokes[i].length; ++j) {
			drawDot(strokes[i][j], samplesSize, color);
		}
	}
	ctx.globalAlpha = 1.0;
}