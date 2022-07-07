## TODO


### Short term goals

- Unified dataset format
  - Conversion scripts
  - Unrecognized samples saved in that format
  - Unified and simplified dataset loader
  - Frontend output files in the same format
  - Dehardcoding of service-specific logic
- Samples viewing:
  - Inspector: samples selection for extraction/removal
  - Datasets / unrecognized samples viewing
  - Samples filtering. Mapping support.
- Dataset creation:
  - Merging (w/o duplicates) and cleaning of hwrt+detexify samples (plus another dataset?)
  - Homemade samples to be added
  - Host the produced dataset on Kaggle
  - Data augmentation on strokes!
  - simple strokes viewer in the backend (e.g w/ matplot) to compare strokes before and after augmentation / preprocessing.
- Symbols list(s) for TeXdrawer' service(s)


### Long term goals

- Build the best math symbols classifier possible, while having a fast inference and client-side compatibiliy.
    - Compare it to exising (or created?) OCR models of comparable size, by creating images from strokes
- Dataset creation tool for math expression using strokes available from the main dataset. Either generate the expression's template and assign segmented strokes to it, or use an existing OCR dataset by keeping the labels but ditching the images, replacing them by strokes in their bounding box.
- Build a math expression 'classifier' from the symbol classifier => segmentation + context
- Benchmark and compare it to existing (OCR) solutions (e.g. ???) or created ones (using Faster-RCNN / R-FCN / SSD / YOLO ...)


### Global

- complete test datasets with new samples, rerun benchmarks!
- documentation on https://pages.github.com, or directly a Wiki on the github page?
- choose a list of symbols to be supported by the TeXdrawer model (use mappings target classes and symbols from symbolsDatasetCreation.js)
- dataset mining: does detexify's dataset contain additional data to be used for TeXdrawer's models? e.g for symbols not supported by hwrt?
- Use [Git LFS](https://git-lfs.github.com/) to save the produced dataset? Careful: 2 GB file size limit! Or just upload it to kaggle. Note: [ODbL 1.0 license](https://opendatacommons.org/licenses/odbl/summary/)


### Frontend

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
- Inspector: allow to export a selection. Also for submitted/file context, allow to remove selected samples.
- Add a button to clear a selection (with confirmation).
- Remember the user to export the selection (if not empty) when reimporting a file or a new dataset? (may not be necessary)


### Backend

- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- use a unified dataset format across services and the frontend. Make conversion scripts
- add some abstraction for things specific to each service


### MLOps

Inputs:

- current commit
- timestamp
- model architecture
- training params
- used preprocessing
- mapping used during training / target classes
- service name: texdrawer-%d (classes number)

Outputs:

- model name (hash?)
- dataset hash?
- stats: benchmark on validation dataset(s) + mappings
- model saved depending on benchmark's results: if better than previous best.
- all input data stats must be saved too.


### Miscellaneous

- Note: getSymbolsDatasetMap() will be deprecated eventually.
- convert latex2unicode from csv to json (?)
- frontend: default context "currInspCtxt" to "" => no drawing
- frontend: send web browser data (navigator.userAgent) in request.js ? Or is it already given?
- backend: dataset merger?
- New dataset:
  - csv format. Header: id;symbol;strokesNumber;totalPoints;webBrowser;strokes
  - shuffle train and test
  - compute checksums
  - rescale strokes to fit well in a universal box (currently for hwrt: [-0.5, 2585, -1, 1096])
  - upload it on Kaggle
    - detail csv data
    - newline: '\n', separator: ';'
    - cols description
    - strokes content, format. Time shift, max dim box, resolution
    - licence ODbL
    - sources: detexify, hwrt. New samples? ratio? Cleaning?
    - discuss 'webBrowser' utility, and why not user_id (privacy, not pertinent...)
- frontend output files and backend "unrecognized" files: to the unified dataset format! (=> rescaling if needed)
- inspector: rescale strokes if needed!
- backend: formatter.reshiftTime(strokes) not to be done in the benchmark eventually.
- dataset loading: use tqdm too?
- dataset loading: bound?
- frontend: http://localhost:5050/javascript-libs/jquery-3.6.0.min.js => js/ css/ (with a root?)
  -> update serveJavascriptLibsList(), serveJavascriptLib(). Also add css dir in front?
