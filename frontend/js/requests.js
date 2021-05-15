"use strict";

const backendIP = "http://" + location.host;
// console.log("Backend IP:", backendIP);


function extractData(response) {
	if (response.status != 200) {
		console.error("Bad response status:", response.status);
		return null;
	}

	const contentType = response.headers.get("content-type"); // case insensitive.
	// console.log("Response content-type:", contentType);
	if (contentType && contentType.includes("application/json")) {
		return response.json();
	}
	else if (contentType && contentType.includes("application/x-www-form-urlencoded")) {
		return response.text();
	}
	else if (contentType && (contentType.includes("text/plain") || contentType.includes("text/html"))) {
		return response.text();
	}
	else {
		console.error("Unsupported response content-type:", contentType);
		return null;
	}
}

// Requesting the classifying services, using JQuery:
function classifyRequest(serviceName, strokes) {
	if (strokes.length == 0) {
		alert("Cannot send a request without any strokes!");
		return;
	}

	let input = {serviceName: serviceName, strokes: strokes};

	$.ajax({
		type: "POST",
		url: "http://localhost:5050/classify-request",
		contentType: "application/x-www-form-urlencoded", // move this to the backend?
		// Accept: "application/json; charset=utf-8",
		data: JSON.stringify(input),

		success: function(response) {
			console.log("Response:", response);
			// jQuery("#test-zone").html(JSON.stringify(response));
			drawClassificationResults(response);
		},
		error: function(e) {
			console.error("CORS issue or invalid URL for:", this.url);
		}
	});
}

function drawClassificationResults(response) {
	$('#resultlink').removeClass('invisible'); // ???
	let content = "<table class='table' role='table' name='resulttable' id='resulttable'>"
		+ "<thead><tr><th>&alpha;</th><th>&alpha;</th><th>LaTeX</th><th>%</th></tr></thead><tbody>";
	$.each(response, function(index, value) {
		let latex_command = value['latex_command'];
		let unicode_dec = value['unicode_dec'];
		let symbolClass = value['class'];
		let score = value['score'];
		let system_id = "???";

		content += "<tr><td>&#" + unicode_dec + ";</td><td>$$" + latex_command + "$$</td><td><input id=\"inptxt" + system_id
			+ "\" class=\"form-control\" value='" + latex_command + "' disabled/></td><td style='text-align:right'>"
			+ parseFloat(score * 100).toFixed(2) + "</td></tr>";
	});
	content += "</tbody></table>";
	typeset("#classification-results", content);
}
