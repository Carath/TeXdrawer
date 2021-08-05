"use strict";

function addAllCells(cells) {
	$("#cells-grid").empty();
	for (let i=0; i < cells.length; ++i) {
		addCell(i, cellSize, cells[i]);
	}
}

function addCell(rank, size, sample) { // 'size' in ex
	let cellID = "cell-" + rank, symbolID = cellID + "-symbol", canvasID = cellID + "-canvas";
	let content =
		"<div class='cell-container' id='" + cellID + "'>" +
			"<div class='cell-top'>" +
				"<div class='cell-top-left cell'>id: " + sample.dataset_id + "</div>" +
				"<div class='cell-top-right cell'>" + sample.unicode + "</div>" +
			"</div>" +
			"<div class='cell-center cell'>" + sample.symbol_class + "</div>" +
			"<div class='cell-bottom'>" +
				"<div class='cell-bottom-left cell' id='" + symbolID + "'>" + sample.symbol_class + "</div>" +
				"<div class='cell-bottom-right cell'>" +
					"<canvas class='cell-canvas' id='" + canvasID + "'></canvas>" +
				"</div>" +
			"</div>" +
		"</div>";
	// TODO: draw sample.strokes
	$("#cells-grid").append(content);
	$("#" + cellID).on("click", function() {
		console.log(rank, cellID, "->", $(this).text());
	});
	typeset("#" + symbolID, "$$" + sample.symbol_class + "$$");
	resizeSVGelement("#" + symbolID, size);
}

// Needs MathJax to render as SVGs!
function getDims(selector) {
	let dims = {};
	let src_xml = $(selector).html();
	let xml = $.parseXML(src_xml), $src_xml = $(xml);
	$($src_xml).each(function() {
		let svgData = $(this).find("mjx-container>svg")[0];
		dims = {
			width: svgData["width"]["baseVal"]["value"], // in ex
			height: svgData["height"]["baseVal"]["value"] // in ex
		};
		// console.log(svgData, dims);
	});
	return dims;
}

// MathJax agnostic!
function resizeSVGelement(selector, size) { // 'size' in ex
	let dims = getDims(selector);
	let maxDim = Math.max(dims.width, dims.height);
	let oldFontSize = parseInt($(selector).css("font-size"), 10);
	let newFontSize = Math.round(oldFontSize * size / maxDim);
	$(selector).css("font-size", newFontSize + "px");
	// console.log("Changed font size of " + selector + " from " + oldFontSize + "px to " + newFontSize + "px");
}

function exampleCells() { // TODO: add example strokes!
	return [
		{dataset_id: "123456", unicode: "U+2211", symbol_class: "\\sum", strokes: []},
		{dataset_id: "654321", unicode: "U+3A3", symbol_class: "\\Sigma", strokes: []},
		{dataset_id: "9514", unicode: "U+222B", symbol_class: "\\int", strokes: []},
		{dataset_id: "75391", unicode: "U+221E", symbol_class: "\\infty", strokes: []},
		{dataset_id: "1472583", unicode: "U+27F9", symbol_class: "\\Longrightarrow", strokes: []},
		{dataset_id: "3681", unicode: "U+220F", symbol_class: "\\prod", strokes: []},
		{dataset_id: "8461", unicode: "U+3A0", symbol_class: "\\Pi", strokes: []},
		{dataset_id: "42069", unicode: "U+2245", symbol_class: "\\cong", strokes: []},
		{dataset_id: "12", unicode: "U+223C", symbol_class: "\\sim", strokes: []},
		{dataset_id: "25981", unicode: "U+2205", symbol_class: "\\varnothing", strokes: []},
		{dataset_id: "1257", unicode: "U+3B1", symbol_class: "\\alpha", strokes: []},
		{dataset_id: "1001", unicode: "U+2020", symbol_class: "\\dagger", strokes: []}
	];
}
