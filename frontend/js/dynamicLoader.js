"use strict";

// This can be used to load javascript libraries, images, ...
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

// Loading javascript libraries:

(function () {
	dynamicLoader("script", "polyfill", {type: "text/javascript", defer: ""}, [
			"libs/polyfill.js",
			"https://polyfill.io/v3/polyfill.min.js?features=es6",
			backendIP + "/javascript-libs/polyfill.js"
		]
	);
})();

(function () {
	dynamicLoader("script", "jQuery", {type: "text/javascript", defer: ""}, [
			"libs/jquery-3.6.0.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
			backendIP + "/javascript-libs/jquery-3.6.0.min.js"
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
	dynamicLoader("script", "MathJax", {type: "text/javascript", defer: ""}, [
			// svg version of MathJax, for checking typesetting success.
			"libs/mathjax-3.2.0-tex-svg-full.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-svg-full.min.js",
			backendIP + "/javascript-libs/mathjax-3.2.0-tex-svg-full.min.js"
		]
	);
})();
