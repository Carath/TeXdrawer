"use strict";

const maxPrintedResults = 10;

const backendIP = "http://" + (location.host === "" ? "localhost:5050" : location.host);
// console.log("Backend IP:", backendIP);

// Get a sorted list of supported symbols for the given service:
function symbolsRequest(service) {
	let startTime = performance.now();
	$.ajax({
		type: "GET",
		url: backendIP + "/symbols/" + service,
		// Accept: "application/json; charset=utf-8",

		success: function(response) {
			drawResultsTable(service, response, startTime, "symbols");
		},
		error: function(xhr) {
			errorHandling(xhr, service);
		}
	});
}


// TODO: make this selectable from the UI:
const MAPP = "none";
// const MAPP = "map1";


// Requesting the classifying services, using JQuery:
function classifyRequest(service, strokes) {
	if (strokes.length == 0) {
		alert("Cannot send a request without any strokes!");
		return;
	}

	let input = {
		inputLib: "plain-js", // library used in inputs.js
		preprocessing: "none",
		frameWidth: canvas.width,
		frameHeight: canvas.height,
		service: service,
		mapping: MAPP,
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
			drawResultsTable(service, response, startTime, "classify");
		},
		error: function(xhr) {
			errorHandling(xhr, service);
		}
	});
}

function errorHandling(xhr, service) {
	if (xhr.status == 0) {
		alert("Error. Are you sure the backend is running? Please check: " + backendIP);
	}
	else {
		alert("Request failed. Make sure the service '" + service + "' is running...");
	}
}

function drawResultsTable(service, response, startTime, mode) {
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
			let symbol_class = value["symbol_class"];
			let unicode = value["unicode"] == "U+0" ? "" : value["unicode"];
			let symbolPackage = value["package"]; // unused for now.
			let scoreHTML = "";

			if (mode == "classify") {
				let score = 0.; // default - for unsupported services.
				if (service == "hwrt") {
					score = (100. * value["score"]).toFixed(1) + " %";
				}
				else if (service == "detexify") {
					score = value["score"].toFixed(3);
				}

				let dataset_id = value["dataset_id"];
				let raw_answer = value["raw_answer"]; // for traceability
				scoreHTML = "<td>" + score + "</td>";
			}

			content += "<tr><td>$" + symbol_class + "$</td><td>" + unicode + "</td><td><input id=\"latex-"
				+ symbol_class + "\" class=\"command-box\" value='" + symbol_class + "' disabled/></td>"
				+ scoreHTML + "</tr>";
		}
	});
	content += "</tbody></table>";
	startTime = performance.now();
	typeset("#classification-results", content);
	let drawingTime = performance.now() - startTime; // in ms
	$('#drawingTime').html(drawingTime);
}
