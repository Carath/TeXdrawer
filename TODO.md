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
- be able to learn from user in production (=> base model + tuned model)


### Backend

- Docker integration of the website and TeXdrawer service.
- give a virtual env solution too (using pipgrip --lock -r requirements.txt).
- add typing, verify with mypy?
- add flask-statistics to the server?
- use argparse for scripts arguments?
- compare Flask with [FastAPI](https://fastapi.tiangolo.com/)
- use a unified dataset format across services and the frontend. Make conversion scripts
- add some abstraction for things specific to each service
- More stats for the benchmark: F1 score, AUC, ROC, R2, MAPE, confusion matrix... per mapping.
- Cache the services forecasts?


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

Use [MLflow](https://mlflow.org/) ?


### Miscellaneous

- Note: getSymbolsDatasetMap() will be deprecated eventually.
- frontend: default context "currInspCtxt" to "" => no drawing
- frontend: send web browser data (navigator.userAgent) in request.js ? Or is it already given?
- backend: dataset merger?
- New dataset:
  - csv format. Header: id;symbol;strokesNumber;totalPoints;userAgent;strokes
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
    - discuss 'userAgent' utility, and why not user_id (privacy, not pertinent...)
- frontend output files and backend "unrecognized" files: to the unified dataset format! (=> rescaling if needed)
- inspector: rescale strokes if needed!
- backend: formatter.reshiftTime(strokes) not to be done in the benchmark eventually.
- dataset loading: use tqdm too?
- dataset loading: bound?


### Data

Training and inference:

- dot data amplification
- balanced split interclass.
- balance class numbers too for train? either move samples to test, or amplify more rare classes...
- resampling inside strokes. Remove sursamples segments, and remove stroke-hole too! Do so to improve the dataset too?
- 2D FFT? Might actually be good on those samples... Or 1D FFT on strokes?
- small rotations in batch during inference? Vote among top 3 classes/activations?
- use a negative class


Datasets:

- global class count number per dataset? Not just train...
- stroke hash? Check em before accepting em as new samples, to avoid redundancies.
- talk about normalization (centered, margin), resolution...


Classes to improve on:

```
\pi                 |       159 |  61.6 % |  93.7 % !!!!!!!
\otimes             |       109 |  86.2 % |  91.7 %
\chi                |       107 |  83.2 % |  87.9 %
\rho                |        91 |  86.8 % |  92.3 %
\zeta               |        87 |  86.2 % |  92.0 %
\mathscr{L}         |        81 |  87.7 % |  91.4 %
\aleph              |        77 |  87.0 % |  89.6 %
.                   |        76 |  84.2 % |  89.5 %
\mathcal{L}         |        75 |  69.3 % |  84.0 %
\theta              |        66 |  69.7 % |  84.8 % !!
\coprod             |        64 |  87.5 % |  90.6 %
\Gamma              |        63 |  84.1 % |  95.2 %
\psi                |        57 |  50.9 % |  96.5 % !!!
\Theta              |        47 |  76.6 % |  87.2 %
\Psi                |        46 |  71.7 % |  93.5 %
\nu                 |        39 |  79.5 % |  87.2 %
```


Symbols to be *potentially* remove from hwrt (some are to be changed with another mapping representation, some are not wanted - to be confirmed):

```
::MULTISYMBOL:: [negative]
\AA
\AE
\Bowtie
\L
\MVAt
\O
\Smiley
\aa
\ae
\astrosun
\checked
\clubsuit
\copyright
\dag
\diameter
\female
\fint
\fullmoon
\guillemotleft
\heartsuit
\iddots
\leftmoon
\lightning
\llbracket
\male
\mapsfrom
\mars
\mathds{1} ... \mathds{Z}
\mathsection
\o
\oiint
\parr
\pentagram
\pounds
\rrbracket
\shortrightarrow
\ss
\sun
\varoiint
\venus
\with
```

Symbols to be added?
- compare with detexify
- classes in similar not reacheable from hwrt by projection ?
- all mathbb
- all visible ASCII and greek symbols? Add cyrilic?
- missing hwrt symbol: ncong ?


New dataset goal:
- Universal, lighter, and easier to read format
- Hosted on Kaggle with a correct licence
- Unnecessary classes removed, and interesting ones added
- Added samples for classes in dire need, and more samples in general
- Fixed incorrect labels (?)
- Added stroke metadata
- Cleaned noisy samples huge timesteps / dots number / strokes number (?)
- Normalized data
- shuffled


ADD ending "\n" in the following file: symbols/latex2unicode.csv
