## TODO


#### Global

- complete test datasets with new samples, rerun benchmarks!
- documentation on https://pages.github.com, or directly a Wiki on the github page?
- choose a list of symbols to be supported by the TeXdrawer model (use mappings target classes and symbols from symbolsDatasetCreation.js)
- dataset mining: does detexify's dataset contain additional data to be used for TeXdrawer's models? e.g for symbols not supported by hwrt?


#### Frontend

- compare MathJax with [KaTeX](https://katex.org/)
- add support for [stixfonts](https://github.com/stipub/stixfonts) ?
- add GPU acceleration to the frontend (if needed) with https://gpu.rocks/#/
- load TensorFlow (with Keras) models in the frontend with: https://www.tensorflow.org/js/guide
- allow to draw symbols from LaTeX packages with MathJax
- individual symbol drawing: like detexify, show several symbols - ignore case, not perfect match!
- grid: move (slightly) symbols drawn with MathJax, to be correctly centered.
- enable to choose several categories of symbols, with ``` <input type="checkbox"> ```. Default: all ticked, except greek alphabet symbols not present in "in_need".
- add a search option for classes/symbols
- enable to visualize some part of a dataset? By index or by classes?
- Use Fabric.js for prettier rendering?


#### Backend

- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- use a unified dataset format across services + conversion scripts
- add some abstraction for things specific to each service
- More mapping coherence check? Can two mappings always be composed?
- Benchmark overhaul: bench on a given list of mapping instead of a single one, with factorization of service requests. If no list is given, then bench on all available mappings.


#### MLOps

Inputs:

- current commit
- timestamp
- model architecture
- training params
- used preprocessing
- mapping used during training / target classes

Outputs:

- model name (hash?)
- stats: benchmark on validation dataset(s) + mappings
- model saved depending on benchmark's results: if better than previous best.
- all input data stats must be saved too.
