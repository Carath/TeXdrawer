"use strict";

function addAllCells(samples) {
	$("#cells-grid").empty();
	for (let i=0; i < samples.length; ++i) {
		addCell(i, cellSize, samples[i]);
	}
}

function addCell(rank, size, sample) { // 'size' in ex
	let dataset_id = "dataset_id" in sample ? sample.dataset_id : "0";
	let unicode = "unicode" in sample ? sample.unicode : "";
	let symbol = "symbol" in sample ? sample.symbol : "";
	let strokes = "strokes" in sample ? sample.strokes : [];
	let cellID = "cell-" + rank, symbolID = cellID + "-symbol", canvasID = cellID + "-canvas";
	let content =
		"<div class='cell-container' id='" + cellID + "'>" +
			"<div class='cell-top'>" +
				"<div class='cell-top-left cell'>id: " + dataset_id + "</div>" +
				"<div class='cell-top-right cell'>" + unicode + "</div>" +
			"</div>" +
			"<div class='cell-center cell'>" + symbol + "</div>" +
			"<div class='cell-bottom'>" +
				"<div class='cell-bottom-left cell' id='" + symbolID + "'>" + symbol + "</div>" +
				"<div class='cell-bottom-right cell'>" +
					"<canvas class='cell-canvas' id='" + canvasID + "'></canvas>" +
				"</div>" +
			"</div>" +
		"</div>";

	$("#cells-grid").append(content);
	$("#" + cellID).on("click", function() {
		console.log(rank, sample);
	});
	let cellCanvas = getFixedCanvas("#" + canvasID);
	let resized = resizeStrokes(cellCanvas, strokes);
	let colors = ["purple", "blue", "green", "gold", "darkorange", "red"];
	showSamples(cellCanvas, resized, colors);
	drawSample("#" + symbolID, sample, size);
}

function mockSamples() {
	let mockStrokes = [[{"x":183,"y":72,"time":0}], [{"x":52,"y":72,"time":245}], [{"x":285,"y":121,"time":713},
		{"x":273,"y":138,"time":729},{"x":256,"y":162,"time":746},{"x":224,"y":187,"time":763},{"x":183,"y":207,"time":780},
		{"x":146,"y":220,"time":798},{"x":113,"y":224,"time":813},{"x":80,"y":228,"time":832},{"x":48,"y":224,"time":846},
		{"x":27,"y":220,"time":862},{"x":15,"y":211,"time":873}]];

	const samplesNumber = 20;
	let mockSamplesList = [];
	for (let i=0; i < samplesNumber; ++i) {
		let index = Math.floor(Math.random() * wannabeSamplesList.length); // between 0 and length-1
		mockSamplesList.push(createSample(i, wannabeSamplesList[index], mockStrokes));
	}
	return mockSamplesList;
}
