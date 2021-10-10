"use strict";

// Replaces the mathematics within the element:
function typeset(selector, html) {
	const node = document.querySelector(selector);
	if (! node) {
		console.error("Cannot typeset missing element:", selector);
		return;
	}
	MathJax.typesetClear([node]);
	node.innerHTML = html;
	MathJax.typesetPromise([node]).then(() => {})
		.catch(err => console.error("Typeset failed:", err.message));
}

// Object needs to be typesetted beforehand. Needs MathJax to render as SVGs!
function getSVGdims(selector) {
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

// Object needs to be typesetted beforehand. Depends on getSVGdims(),
// so not MathJax agnostic. Sample is not resized when 'size' (in ex) is < 0.
function resizeSVGelement(selector, size) {
	if (size < 0) {
		return;
	}
	let dims = getSVGdims(selector);
	let maxDim = Math.max(dims.width, dims.height);
	let oldFontSize = parseInt($(selector).css("font-size"), 10); // radix 10
	let newFontSize = maxDim === 0 ? 0 : Math.round(oldFontSize * size / maxDim);
	$(selector).css("font-size", newFontSize + "px");
	// console.log("Changed font size of " + selector + " from " + oldFontSize + "px to " + newFontSize + "px");
}

// Needs MathJax to render as SVGs! May fail if rendering color is red...
function typesettingSuccess(selector) {
	let success = true;
	let src_xml = $(selector).html();
	let xml = $.parseXML(src_xml), $src_xml = $(xml);
	$($src_xml).each(function() {
		let data = $(this).find("mjx-container>svg>g>g>g")[0]["attributes"];
		// console.log(data);
		let mml_node = "data-mml-node" in data ? data["data-mml-node"]["value"] : "",
			fillColor = "fill" in data ? data["fill"]["value"] : "",
			strokeColor = "stroke" in data ? data["stroke"]["value"] : "";
		if (mml_node === "merror" || (mml_node === "mtext" && fillColor === "red" && strokeColor === "red")) {
			success = false;
		}
	});
	return success;
}

function unicodeToHTML(unicode) {
	return unicode.length < 2 ? "" : "&#x" + unicode.substring(2) + ";";
}

// Drawing with 'symbol' by default, falling back to 'unicode' on failure.
// Does not try to resize the sample when 'size' (in ex) is < 0.
function drawSample(selector, sample, size) {
	let success = false;
	if ("symbol" in sample && sample.symbol !== "") {
		typeset(selector, "$" + sample.symbol + "$");
		success = typesettingSuccess(selector);
	}
	if (! success && "unicode" in sample && sample.unicode !== "") {
		// console.log("Typesetting failed using latex command, falling back to unicode drawing for sample:", sample);
		typeset(selector, "$" + unicodeToHTML(sample.unicode) + "$");
		success = typesettingSuccess(selector);
	}
	if (! success) {
		console.error("Complete failure to typeset sample:", sample);
	}
	resizeSVGelement(selector, size);
	return success;
}
