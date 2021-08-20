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
	script.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-svg-full.min.js";
	// svg version, for fine control of symbol output size.
	document.head.appendChild(script);
})();

// Replaces the mathematics within the element:
function typeset(selector, html) {
	"use strict";
	const node = document.querySelector(selector);
	if (! node) {
		console.error("Cannot typeset missing element:", selector);
		return;
	}
	MathJax.typesetClear([node]);
	node.innerHTML = html;
	MathJax.typesetPromise([node]).then(() => {})
		.catch(err => console.error("Typeset failed:", err.message));
}
