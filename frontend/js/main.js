"use strict";

// Settings:
const lineThickness = 6;
const samplesSize = 3;
const samplesOpacity = 0.5;
const drawingColor = "orange";
const samplesColor = "green";
const rescaledSamplesColor = "red";

var canvas = null;
var ctx = null;

window.onload = function() {
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");

	// Starting from the canvas only, but drawing and samples
	// acquisition must continue outside!
	canvas.addEventListener("mousedown", startInputs);

	$("#exportButton").click(function(e) {
		save();
	});

	$("#retryButton").click(function(e) {
		clearInputs();
	});

	$("#submitButton").click(function(e) {
		submitSymbol();
	});

	$("#showSamplesButton").click(function(e) { // for testing purposes
		let resized = resize(inputStrokes);
		showSamples(inputStrokes, samplesColor);
		showSamples(resized, rescaledSamplesColor);
	});

	$("#classifyButton").click(function(e) {
		classifyRequest(serviceChoice.value, mappingChoice.value, inputStrokes); // sending raw inputs.
	});

	$("#symbolsButton").click(function(e) {
		symbolsRequest(serviceChoice.value, mappingChoice.value);
		clearInputs();
	});

	// $("#testButton").click(function(e) {
	// 	typeset("#mathjax-test", "$$\\frac{a^3}{1-a^2}$$");
	// });
	// testButton.hidden = false;

	$("#sidenav-about").click(function(e) {
		$(this).addClass('active').siblings().removeClass('active');
		$("#about").show();
		$("#centerArea, .right").hide();
		$('#classification-results').empty();
		clearInputs();
	});

	$("#sidenav-classify").click(function(e) {
		$(this).addClass('active').siblings().removeClass('active');
		$("#about, #exportButton, #submitButton, #showSamplesButton").hide();
		$("#centerArea, #classifyButton, #symbolsButton, #serviceArea, .right").show();
		$('#classification-results').empty();
		$('#usage').html("Trying out some classification services (locally):");
		$('#stats').html("");
		clearInputs();
		servicesAndMappingsRequest();
	});

	$("#sidenav-draw").click(function(e) {
		$(this).addClass('active').siblings().removeClass('active');
		$("#about, #classifyButton, #symbolsButton, #serviceArea").hide();
		$("#centerArea, #exportButton, #submitButton, #showSamplesButton, .right").show();
		$('#classification-results').empty();
		$('#usage').html("Dataset creation tool:");
		$('#stats').html("");
		clearInputs();
	});

	$("#sidenav-inspect").click(function(e) {
		// $(this).addClass('active').siblings().removeClass('active');
		// $("#about").hide();
		// $('#classification-results').empty();
		// clearInputs();
		alert("Note done yet!");
	});
}
