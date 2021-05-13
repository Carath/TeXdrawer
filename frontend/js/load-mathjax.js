(function () {
	"use strict";
	if (! window.MathJax) {
		window.MathJax = {
			tex: {
				inlineMath: {'[+]': [['$', '$']]}
			}
		};
	}
	let script = document.createElement('script');
	script.src = "https://cdn.jsdelivr.net/npm/mathjax@3.0.1/es5/tex-mml-chtml.js";
	document.head.appendChild(script);
})();

// Replaces the mathematics within the element:
function typeset(selector, html) {
	"use strict";
	const node = document.querySelector(selector);
	if (! node) {
		console.err("Cannot typeset missing element:", selector);
		return;
	}
	MathJax.typesetClear([node]);
	node.innerHTML = html;
	MathJax.typesetPromise([node]).then(() => {})
		.catch(err => console.err("Typeset failed:", err.message));
}
