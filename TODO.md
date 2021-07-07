## TODO


#### Global:

- create custom classes based on groups of symbols
- complete test datasets with new samples
- add offline support?
- feature: if a projection is used, return and print the actual number of classes in a symbols list request. Also print the mapping?
- fill the empty values in each 'guess': symbol_class, unicode_dec
- add more details on the project goal/description (main README and index.html). Talk more about OCR, and open source!


#### Frontend:

- compare MathJax with [KaTeX](https://katex.org/)
- allow to draw symbols from LaTeX packages with MathJax
- frontend > datasets : symbol metadata
- Complete work on the balanced dataset builder, with custom classes.
- better input acquisition (samples number)?
- prettier cleanup button
- enable to switch of symbol mappings.


#### Backend:

- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- obtain frequencies of each classes, for a given mapping and dataset. [dataset creator]
- obtain frequencies of each symbols in its equivalence class, for a given mapping and dataset. [disambiguation]
- load getLatexToUnicodeMap() only once? Same for symbols lists?
- list of symbols requests: send projected symbols for the current mapping.
