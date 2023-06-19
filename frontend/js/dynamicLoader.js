"use strict";

// Plain javascript function for loading js / css libraries, images, ...
// Several links may be given, which can either be URLs or file paths,
// and will be tried in the given order until the resource is loaded or all links failed.
function dynamicLoader(type, id, attributes={}, links, onSuccess=()=>{}, onFailure=()=>{}) {
	if (document.getElementById(id) !== null) {
		console.log(id + " element already exists.");
		return;
	}
	if (links.length === 0) {
		console.error("Completely failed to load '" + id + "' element.");
		onFailure();
		return;
	}

	let element = document.createElement(type);
	element.setAttribute("id", id);
	element.setAttribute("src", links[0]);
	let keys = Object.keys(attributes);
	for (let i=0; i < keys.length; ++i) {
		element.setAttribute(keys[i], attributes[keys[i]]);
	}
	document.body.appendChild(element);

	element.onload = () => { // may fail with Internet Explorer.
		console.log(id + " element has loaded.");
		onSuccess();
	}

	element.onerror = () => {
		// console.log("Failed to load element '" + id + "' with link: " + links[0]);
		document.body.removeChild(element);
		dynamicLoader(type, id, attributes, links.slice(1), onSuccess, onFailure);
	}
}

// Loading resources e.g javascript or css libraries. This works both when opening the index.html
// file with a web browser (offline mode), and when the website is hosted on a remote server.
// First an attempt is made to fetch those files locally, which must work offline but must not
// send files from the server in the remote case, as it is better to use a CDN (second link) in
// that case. Thus, those files should not be placed in the frontend/ directory.
// Finally if all else failed, a last link is provided to fetch the files from a backup server.

(function () {
	dynamicLoader("script", "polyfill", {type: "text/javascript", defer: ""}, [
			"../libs-frontend/polyfill.js",
			"https://polyfill.io/v3/polyfill.min.js?features=es6",
			backupServerIP + "/libs-frontend-file/polyfill.js"
		]
	);
})();

(function () {
	dynamicLoader("script", "jQuery", {type: "text/javascript", defer: ""}, [
			"../libs-frontend/jquery-3.6.0.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
			backupServerIP + "/libs-frontend-file/jquery-3.6.0.min.js"
		]
	);
})();

(function () {
	if (! window.MathJax) {
		window.MathJax = {
			tex: {
				inlineMath: {'[+]': [['$', '$']]}
			}
		};
	}
	// Svg version of MathJax, for checking typesetting success.
	// Note: version 3.2.2 causes issues e.g with U+20AC.
	dynamicLoader("script", "MathJax", {type: "text/javascript", defer: ""}, [
			"../libs-frontend/mathjax-3.2.0-tex-svg-full.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-svg-full.min.js",
			backupServerIP + "/libs-frontend-file/mathjax-3.2.0-tex-svg-full.min.js"
		]
	);
})();
