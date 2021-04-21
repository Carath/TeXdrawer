// Note: drawing outside the frame should be permitted (in case the user
// goes slightly beyond the border). However, samplings should be recentered,
// and rescaled as to be homogeneous.

window.onload = function() {
	// Settings:
	const borderRatio = 0.05; // param which must be a metadata, as long with width / height (unless in unit square).

	var lineThickness = 6;
	var samplesSize = 3;
	var samplesOpacity = 0.5;
	var drawingColor = 'orange';
	var samplesColor = 'green';

	var strokes = [];
	var currentStroke = [];
	var currCoord = { x: 0, y: 0 };

	const canvas = document.getElementById("myCanvas");
	const ctx = canvas.getContext("2d");

	var saveButton = document.getElementById('saveButton');
	saveButton.addEventListener("click", function(e) {
		save();
	});

	var clearButton = document.getElementById('clearButton');
	clearButton.addEventListener("click", function(e) {
		clear();
	});

	var showSamplesButton = document.getElementById('showSamplesButton');
	showSamplesButton.addEventListener("click", function(e) {
		showSamples(strokes, samplesColor);
		let strokesInFrame = shiftedAndRescaled(strokes);
		showSamples(strokesInFrame, 'red');
	});

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	canvas.addEventListener("mousedown", start);

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
			strokes.push(currentStroke);
			currentStroke = [];
			console.log("strokes:", strokes);
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
		currentStroke.push({
			x: currCoord.x,
			y: currCoord.y
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

	function clear() {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		strokes = [];
		currentStroke = [];
	}

	function showSamples(strokes, color) {
		// clear();
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

		// Starting from the fit dot, which must exist:
		let xMin = strokes[0][0].x, xMax = strokes[0][0].x;
		let yMin = strokes[0][0].y, yMax = strokes[0][0].y;

		for (let i = 0; i < strokes.length; ++i) {
			for (let j = 0; j < strokes[i].length; ++j) {
				let x = strokes[i][j].x, y = strokes[i][j].y;
				xMin = x < xMin ? x : xMin;
				xMax = x > xMax ? x : xMax;
				yMin = y < yMin ? y : yMin;
				yMax = y > yMax ? y : yMax;
			}
		}

		return [xMin, xMax, yMin, yMax];
	}

	// Works, but needs to be changed: the strokes should not be stretched...
	// Careful: integer roundings necessary? If so use Math.round()
	function shiftedAndRescaled(strokes) {
		let box = boundingBox(strokes);
		if (box == null) {
			return [];
		}

		let xMin = box[0], xMax = box[1], yMin = box[2], yMax = box[3];
		let boxWidth = xMax - xMin, boxHeight = yMax - yMin;
		let canvasDim = Math.min(canvas.width, canvas.height), boxDim = Math.max(boxWidth, boxHeight);
		let scale = (1. - 2. * borderRatio) * canvasDim / boxDim;
		let offsetX = scale * ((boxDim -  boxWidth) / 2. - xMin) + (canvas.width  - canvasDim) / 2. + borderRatio * canvasDim;
		let offsetY = scale * ((boxDim - boxHeight) / 2. - yMin) + (canvas.height - canvasDim) / 2. + borderRatio * canvasDim;
		let newStrokes = [];

		for (let i = 0; i < strokes.length; ++i) {
			let stroke = [];
			for (let j = 0; j < strokes[i].length; ++j) {
				stroke.push({
					x: scale * strokes[i][j].x + offsetX,
					y: scale * strokes[i][j].y + offsetY
				});
			}
			newStrokes.push(stroke);
		}
		return newStrokes;
	}

	function save() {
		alert("TODO!");
	}
}
