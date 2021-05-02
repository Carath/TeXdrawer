(function () {
	"use strict";
	if (document.body.querySelector('math') ||
			document.body.textContent.match(/(?:\$|\\\(|\\\[|\\begin\{.*?})/)) {
		if (!window.MathJax) {
			window.MathJax = {
				tex: {
					inlineMath: {'[+]': [['$', '$']]}
				}
			};
		}
		let script = document.createElement('script');
		script.src = "https://cdn.jsdelivr.net/npm/mathjax@3.0.1/es5/tex-mml-chtml.js";
		document.head.appendChild(script);
	}
})();
