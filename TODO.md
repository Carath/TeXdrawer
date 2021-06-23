## TODO


Global:
- create custom classes based on groups of symbols
- complete test datasets with new samples
- add offline support?
- feature: if a projection is used, return and print the actual number of classes in a symbols list request. Also print the mapping?
- add a request to get the list of supported mappings?

Frontend:
- compare MathJax with [KaTeX](https://katex.org/)
- allow to draw symbols from LaTeX packages with MathJax
- frontend > datasets : symbol metadata
- Complete work on the balanced dataset builder, with custom classes.
- prettier cleanup button
- enable to switch of symbol mappings.

Backend:
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- support custom classes
- obtain frequencies of each symbol, in each dataset
- improve on custom server.py starting location?
- fetch available mappings from the directory, and print them in the benchmark tooltip.
- find discarded symbols by hwrt.
