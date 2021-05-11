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

function fetchContent(url, options, onSuccess, onFailure) {
	fetch(url, options)
		.then(response => extractData(response))
		.then(response => {
			if (response) { // do something with the response!
				onSuccess(response);
			}
		})
		.catch(error => {
			console.error("CORS issue or invalid URL for:", url);
			// console.error("Error:", error);
			onFailure();
		});
}

function requestTest() {
	// --------------------------------------------------
	// Requesting server-flask, using plain javascript:

	// const options = {
	// 	method: "POST",
	// 	headers: {
	// 		"Content-Type": "application/json",
	// 		// "Accept": "application/json"
	// 	},
	// 	body: JSON.stringify({name: "tartampion"})
	// };

	// fetchContent("http://localhost:5050/post", options, defaultOnSuccess, defaultOnFailure);

	// --------------------------------------------------
	// Requesting the hwrt service (classify), using JQuery:

	// let secret = "b2ce3b41-8e43-4c5b-ad97-90ca251aa9d7"; // does not seem to be required...
	let secret = "";

	let lines = [[{x: 50, y: 60, time: 123456}, {x: 150, y: 160, time: 123460}]];
	let data = {"secret": secret, "classify": JSON.stringify(lines)};

	$.ajax({
		type: "POST",
		url: "http://localhost:5050/redirect-hwrt",
		contentType: "application/x-www-form-urlencoded",
		// Accept: "text/html; charset=utf-8",
		data: JSON.stringify(data),

		success: function(response) {
			console.log("Response:", response);
			jQuery("#test-zone").html(response);
		},
		error: function(e) {
			console.error("CORS issue or invalid URL for:", url);
		}
	});
}

function defaultOnSuccess(response) {
	console.log("Response:", response);
}

function defaultOnFailure() {}
