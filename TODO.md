## TODO


#### Global

- finish work on dataset creator & viewer
- complete test datasets with new samples, rerun benchmarks


#### Frontend

- add offline support! Libs like jquery or MathJax could be provided, MathJax logo too. Careful: do not put 'large' files in frontend/, for they would be automatically sent by the backend. Instead, place them at the root, and create a custom (portable) loader: local ?> cdnjs ?> backend.
- compare MathJax with [KaTeX](https://katex.org/)
- add support for [stixfonts](https://github.com/stipub/stixfonts) ?
- allow to draw symbols from LaTeX packages with MathJax
- frontend > datasets : symbol metadata
- Complete work on the balanced dataset builder, with custom classes.
- better input acquisition (samples number)? Check some javascript libraries.
- grid: move (slightly) symbols drawn with MathJax, to be correctly centered.
- add support for symbols not drawn by MathJax: detect them, add a placeholder for the inspector, and skip them during dataset creation.
- classify: typeset only where needed - speed gain?


#### Backend

- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- obtain frequencies of each classes, for a given mapping and dataset. [dataset creator]
- obtain frequencies of each symbols in its equivalence class, for a given mapping and dataset. [disambiguation]
