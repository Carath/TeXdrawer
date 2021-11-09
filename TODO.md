## TODO


#### Global

- complete test datasets with new samples, rerun benchmarks!


#### Frontend

- compare MathJax with [KaTeX](https://katex.org/)
- add support for [stixfonts](https://github.com/stipub/stixfonts) ?
- allow to draw symbols from LaTeX packages with MathJax
- individual symbol drawing: like detexify, show several symbols - ignore case, not perfect match!
- grid: move (slightly) symbols drawn with MathJax, to be correctly centered.
- enable to choose several categories of symbols, with ``` <input type="checkbox"> ```. Default: all ticked, except greek alphabet symbols not present in "in_need".
- add a search option for classes/symbols


#### Backend

- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- use a unified dataset format across services?
- add some abstraction for things specific to each service
