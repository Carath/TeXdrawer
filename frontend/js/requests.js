"use strict";

const maxPrintedResults = 10;

const backendIP = "http://" + (location.host === "" ? "localhost:5050" : location.host);
// console.log("Backend IP:", backendIP);

// Fetch supported services and mappings from the backend:
function servicesAndMappingsRequest() {
	let startTime = performance.now();
	$.ajax({
		type: "GET",
		url: backendIP + "/services-and-mappings",
		contentType: "application/json; charset=utf-8",
		Accept: "application/json; charset=utf-8",
		timeout: 500, // in ms

		success: function(response) {
			// let responseTime = elapsedTime(startTime); // in ms
			// console.log("Mappings request took " + responseTime + " ms");
			$("#serviceChoice").empty();
			$("#mappingChoice").empty();
			let services = response['services'];
			let mappings = response['mappings'];
			for (let i=0; i < services.length; ++i) {
				serviceChoice.add(new Option(services[i], services[i]));
			}
			for (let i=0; i < mappings.length; ++i) {
				mappingChoice.add(new Option(mappings[i], mappings[i]));
			}
		},
		error: function(xhr) {
			errorHandling(xhr, "");
		}
	});
}

// Get a sorted list of supported symbols for the given service:
function symbolsRequest(service, mapping) {
	let startTime = performance.now();
	$.ajax({
		type: "GET",
		url: backendIP + "/symbols/" + service + (mapping === "" ? "" : "/" + mapping),
		contentType: "application/json; charset=utf-8",
		Accept: "application/json; charset=utf-8",
		timeout: 500, // in ms

		success: function(response) {
			drawResultsTable(service, mapping, response, startTime, "symbols");
		},
		error: function(xhr) {
			errorHandling(xhr, service);
		}
	});
}

// Requesting the classifying services, using JQuery:
function classifyRequest(service, mapping, strokes) {
	if (strokes.length === 0) {
		alert("Cannot send a request without any strokes!");
		return;
	}

	let input = {
		inputLib: "plain-js", // library used in inputs.js
		preprocessing: "none",
		frameWidth: inputCanvas.width,
		frameHeight: inputCanvas.height,
		service: service,
		mapping: mapping,
		bound: maxPrintedResults, // comment or use 0 to disable.
		pretty: true,
		strokes: strokes
	};

	let startTime = performance.now();
	$.ajax({
		type: "POST",
		url: backendIP + "/classify",
		contentType: "application/json; charset=utf-8",
		Accept: "application/json; charset=utf-8",
		timeout: 5000, // in ms
		data: JSON.stringify(input),

		success: function(response) {
			drawResultsTable(service, mapping, response, startTime, "classify");
		},
		error: function(xhr) {
			errorHandling(xhr, service);
		}
	});
}

function errorHandling(xhr, service) {
	if (xhr.status === 0) {
		alert("Error. Are you sure the backend is running? Please check: " + backendIP);
	}
	else if (service !== "") {
		alert("Request failed. Make sure the service '" + service + "' is running...");
	}
}

function drawResultsTable(service, mapping, response, startTime, mode) {
	let responseTime = elapsedTime(startTime); // in ms

	// // For testing:
	// console.log("Response:", response);
	// jQuery("#test-zone").html(JSON.stringify(response));

	let serviceMappingInfo = (mapping === "" || mapping === "none") ? "" : ", using mapping <strong>" + mapping + "</strong>";
	serviceMappingInfo = "service <strong>" + service + "</strong>" + serviceMappingInfo + ":";

	let title = "Found <strong>" + response.length + "</strong> symbols for " + serviceMappingInfo;
	let scoreColumn = "";
	let symbolsBound = response.length;

	if (mode === "classify") {
		title = "Prediction by " + serviceMappingInfo;
		scoreColumn = "<th>Score</th>";
		symbolsBound = maxPrintedResults;
	}

	let content = "<p class='responseTime'><i>Response time: " + responseTime + " ms, drawing time: "
		+ "<span id='drawingTime'></span> ms</i><br>" + title + "</p>"
		+ "<br><table class='resultTable' role='table' name='resultTable' id='resultTable'>"
		+ "<thead><tr><th>Symbol</th><th>Unicode</th><th>LaTeX</th>" + scoreColumn + "</tr></thead><tbody>";

	$.each(response, function(index, value) {
		if (index < symbolsBound) {
			let symbol = value["symbol_class"];
			let unicode = value["unicode"] === "U+0" ? "" : value["unicode"];
			let symbolPackage = "package" in value ? value["package"] : ""; // unused for now.
			let scoreHTML = "";

			if (mode === "classify") {
				scoreHTML = "<td>" + value["score"] + "</td>";
				let dataset_id = "dataset_id" in value ? value["dataset_id"] : 0;
				let raw_answers = "raw_answers" in value ? value["raw_answers"] : []; // for traceability
			}

			content += "<tr><td>$" + symbol + "$</td><td>" + unicode + "</td><td><input id=\"latex-"
				+ symbol + "\" class=\"symbol-class-box\" value='" + symbol + "' disabled/></td>"
				+ scoreHTML + "</tr>";
		}
	});
	content += "</tbody></table>";
	startTime = performance.now();
	typeset("#classification-results", content);
	let drawingTime = elapsedTime(startTime); // in ms
	$("#drawingTime").html(drawingTime);
	// Note: it isn't viable here to use drawSample() on each symbol in order to
	// correctly draw them all, for it takes way to long to print them one by one...
}

// Use performance.now() to get a starting point. Result in ms.
function elapsedTime(start) {
	return Math.round(performance.now() - start);
}
