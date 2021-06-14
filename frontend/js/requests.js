"use strict";

const maxPrintedResults = 10;

const backendIP = "http://" + (location.host === "" ? "localhost:5050" : location.host);
// console.log("Backend IP:", backendIP);

// Get a sorted list of supported symbols for the given service:
function symbolsRequest(serviceName) {
	let startTime = performance.now();
	$.ajax({
		type: "GET",
		url: backendIP + "/symbols/" + serviceName,
		// Accept: "application/json; charset=utf-8",

		success: function(response) {
			drawResultsTable(response, startTime, "symbols");
		},
		error: function(xhr) {
			errorHandling(xhr);
		}
	});
}

// Requesting the classifying services, using JQuery:
function classifyRequest(serviceName, strokes) {
	if (strokes.length == 0) {
		alert("Cannot send a request without any strokes!");
		return;
	}

	let input = {
		inputLib: "plain-js", // library used in inputs.js
		preprocessing: "none",
		frameWidth: canvas.width,
		frameHeight: canvas.height,
		service: serviceName,
		strokes: strokes
	};

	let startTime = performance.now();
	$.ajax({
		type: "POST",
		url: backendIP + "/classify",
		// contentType: "application/x-www-form-urlencoded",
		// Accept: "application/json; charset=utf-8",
		data: JSON.stringify(input),

		success: function(response) {
			drawResultsTable(response, startTime, "classify");
		},
		error: function(xhr) {
			errorHandling(xhr);
		}
	});
}

function errorHandling(xhr) {
	if (xhr.status == 0) {
		alert("Error. Are you sure the backend is running? Please check: " + backendIP);
	}
	else {
		alert("Request failed. Make sure the service '" + serviceName + "' is running...");
	}
}

function drawResultsTable(response, startTime, mode) {
	let responseTime = performance.now() - startTime; // in ms

	// // For testing:
	// console.log("Response:", response);
	// jQuery("#test-zone").html(JSON.stringify(response));

	let scoreColumn = "";
	let title = "Symbols number: " + response.length;
	let symbolsBound = response.length;

	if (mode == "classify") {
		scoreColumn = "<th>Score</th>";
		title = "Prediction (up to " + maxPrintedResults + " classes):";
		symbolsBound = maxPrintedResults;
	}

	let content = "<p class='responseTime'><i>Response time: " + responseTime + " ms, drawing time: "
		+ "<span id='drawingTime'></span> ms</i><br>" + title + "</p>"
		+ "<br><table class='resultTable' role='table' name='resultTable' id='resultTable'>"
		+ "<thead><tr><th>Symbol</th><th>Unicode</th><th>LaTeX</th>" + scoreColumn + "</tr></thead><tbody>";

	$.each(response, function(index, value) {
		if (index < symbolsBound) {
			let latex_command = value;
			let unicode_dec = "-";
			let symbolClass = "";
			let scoreHTML = "";

			if (mode == "classify") {
				latex_command = value['latex_command'];
				unicode_dec = value['unicode_dec'];
				symbolClass = value['symbol_class']; // unused for now.
				scoreHTML = "<td>" + value['score'] + "</td>"; // score already a formatted string.
			}

			content += "<tr><td>$" + latex_command + "$</td><td>" + unicode_dec + "</td><td><input id=\"latex-"
				+ unicode_dec + "\" class=\"command-box\" value='" + latex_command + "' disabled/></td>"
				+ scoreHTML + "</tr>";
		}
	});
	content += "</tbody></table>";
	startTime = performance.now();
	typeset("#classification-results", content);
	let drawingTime = performance.now() - startTime; // in ms
	$('#drawingTime').html(drawingTime);
}
