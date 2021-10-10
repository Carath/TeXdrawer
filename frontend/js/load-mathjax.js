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
