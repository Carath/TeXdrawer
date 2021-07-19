## TODO


#### Global:

- create custom classes based on groups of symbols
- complete test datasets with new samples
- add offline support?
- add more details on the project goal/description (main README and index.html). Talk more about OCR, and open source!


#### Frontend:

- compare MathJax with [KaTeX](https://katex.org/)
- allow to draw symbols from LaTeX packages with MathJax
- frontend > datasets : symbol metadata
- Complete work on the balanced dataset builder, with custom classes.
- better input acquisition (samples number)?
- prettier cleanup button


#### Backend:

- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- obtain frequencies of each classes, for a given mapping and dataset. [dataset creator]
- obtain frequencies of each symbols in its equivalence class, for a given mapping and dataset. [disambiguation]
- use argparse for scripts arguments?
- shield the benchmark against unsupported (projected) classes from the dataset, for the given service.
- print better data on previous dataset limitations at a benchmark start, with proper mapping support.
