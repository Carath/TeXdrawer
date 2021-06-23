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
			let latex_command = value;
			let unicode_dec = "-";
			let symbolClass = "";
			let scoreHTML = "";

			if (mode == "classify") {
				let score = (100. * value["score"]).toFixed(1) + " %";
				if (service == "detexify") {
					score = value["score"].toFixed(3);
				}
				latex_command = value["latex_command"];
				unicode_dec = value["unicode_dec"];
				symbolClass = value["symbol_class"]; // unused for now.
				scoreHTML = "<td>" + score + "</td>";
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
