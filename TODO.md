## TODO


Global:
- create custom classes based on groups of symbols
- complete test datasets with new samples

Frontend:
- compare MathJax with [KaTeX](https://katex.org/)
- allow to draw symbols from LaTeX packages with MathJax
- frontend > datasets : symbol metadata
- new buttons layout - https://www.w3schools.com/csS/css3_buttons.asp

Backend:
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- support custom classes
- obtain frequencies of each symbol, in each dataset
- add GET requests for each service list of symbols/classes (and print them?)
- add curl requests examples


Benchmark issues:
- MEAN (classes) stats probably wrong: many classes with too few samples.
- Detexify: training supposed to be the first 20k samples, not sure about that...
New samples need to be created to have a more robust validation.
Detail methodology! (detex 20K last, #notAllSymbols, formats issues...)

Detexify symbols issues:
- \\  vs  \_
- \not_sim  vs  \not\sim
- \not_approx  vs  \not\approx
- \not_equiv  vs  \not\equiv
- \not_simeq  vs  \not\simeq
