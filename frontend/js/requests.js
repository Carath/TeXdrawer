"use strict";

const backendIP = "http://" + location.host;
// console.log("Backend IP:", backendIP);


// Requesting the classifying services, using JQuery:
function classifyRequest(serviceName, strokes) {
	if (strokes.length == 0) {
		alert("Cannot send a request without any strokes!");
		return;
	}

	let input = {
		inputLib: "plain-js", // library used in inputs.js
		frameWidth: canvas.width,
		frameHeight: canvas.height,
		serviceName: serviceName,
		strokes: strokes
	};

	$.ajax({
		type: "POST",
		url: "http://localhost:5050/classify-request",
		contentType: "application/x-www-form-urlencoded", // move this to the backend?
		// Accept: "application/json; charset=utf-8",
		data: JSON.stringify(input),

		success: function(response) {
			// console.log("Response:", response);
			// jQuery("#test-zone").html(JSON.stringify(response));
			drawClassificationResults(response);
		},
		error: function(e) {
			console.error("CORS issue or invalid URL for:", this.url);
		}
	});
}

function drawClassificationResults(response) {
	let content = "<table class='resultTable' role='table' name='resultTable' id='resultTable'>"
		+ "<thead><tr><th>Symbol</th><th>Unicode</th><th>LaTeX</th><th>Probability</th></tr></thead><tbody>";
	$.each(response, function(index, value) {
		let latex_command = value['latex_command'];
		let unicode_dec = value['unicode_dec'];
		let symbolClass = value['class'];
		let score = value['score'];

		content += "<tr><td>$" + latex_command + "$</td><td>" + unicode_dec + "</td><td><input id=\"latex-"
			+ unicode_dec + "\" class=\"command-box\" value='" + latex_command + "' disabled/></td><td>"
			+ parseFloat(score * 100).toFixed(2) + " %</td></tr>";
	});
	content += "</tbody></table>";
	typeset("#classification-results", content);
}
