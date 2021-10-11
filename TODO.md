## TODO


#### Global

- finish work on dataset creator & viewer
- complete test datasets with new samples, rerun benchmarks


#### Frontend

- add offline support! Libs like jQuery or MathJax could be provided, MathJax logo too. Careful: do not put 'large' files in frontend/, for they would be automatically sent by the backend. Instead, place them at the root, and create a custom (portable) loader: local ?> cdnjs ?> backend.
- compare MathJax with [KaTeX](https://katex.org/)
- add support for [stixfonts](https://github.com/stipub/stixfonts) ?
- allow to draw symbols from LaTeX packages with MathJax
- individual symbol drawing: like detexify, show several symbols - ignore case, not perfect match!
- grid: move (slightly) symbols drawn with MathJax, to be correctly centered.
- add mobiles support for input acquisition
- inspector: import files
- enable to choose several categories of symbols, with ``` <input type="checkbox"> ```. Default: all ticked, except greek alphabet symbols not preset in "in_need".
- Inspector: bound number of drawn symbols. Add arrow buttons to loop through them.


#### Backend

- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- obtain frequencies of each classes, for a given mapping and dataset. [dataset creator]
- obtain frequencies of each symbols in its equivalence class, for a given mapping and dataset. [disambiguation]
- add some abstraction for things specific to each service

Work to be done on the benchmarks tool:

- print n° found symbols / total mapped, and print all symbols (found or not).
- Do not use the missing classes in global stats computations, and explain that in the benchmark function help. Add a custom threshold.
- handle the limit case where sampleNumber = 0.
- add a progress bar
- what happens if hwrt answers MULTISYMBOL during the bench? Is it a 'negative' class, or is it supposed to detect combinations of learned symbols? Add Support for a negative class anyway.
- regenerate ALL benchs for ALL services after those changes! Everything may change!
