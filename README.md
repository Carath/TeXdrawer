# TeXdrawer

*Small tool for handwritten LaTeX symbols recognition.*

## About

The goals of this small project are the following:
- Helping to build *balanced* datasets of handwritten symbols, by providing a simple GUI asking users to draw inputs for randomly selected symbols. Furthermore, the GUI should also provide a way to visualize such datasets, both sequentially and by filtering under given criteria. Even though any type of handwritten symbols could be relevant to this project, the main focus for now are math ones. Specifically, digits, latin and greek alphabets, and common math symbols used in formulas. Such symbols may be identified by their unicode, or their LaTeX command.
- Benchmarking existing free open-source services allowing recognition of handwritten symbols, with as less bias as possible, and with support for regrouping similar symbols as shared classes.
- Obtaining the most accurate service for a specified task, either by modifying the tested services, or by building new ones. The resulting service, should however be relatively lightweight and fast, for the target hardware may be tablet computers, or low power laptops with a touchscreen monitor. Additionally, a purely client-side offline version could be desired.
- Extending the obtained service capabilities to recognize associations of handwritten symbols, be them words, sentences, or math formulas. Moreover, the service should be able to replace in real-time user drawn symbols by the predicted ones, but also give the possiblity to change or correct the prediction should it be wrong. Small rotations of symbols should not hinder the system much.

Note: in this project, input handwritten symbols are only received as sequences of 2D points (called *strokes*), not scanned images. This is *not* an [OCR](https://en.wikipedia.org/wiki/Optical_character_recognition) project! Limiting input acquisition in such a way has several advantages:
- inputs are way less noisy;
- raw inputs are obtained, therefore noise will have few variations between users or devices;
- it allows for fast and effective segmentation for associations of symbols. Rotations are cheap too.

This notably prevents issues one would expect to rise with OCR, due to disparity in scanning device resolution, acquisition luminosity, image contrast, fuzziness / sharpness, symbol line color or thickness, ...


## Installation

### TeXdrawer

The dataset creation tool from TeXdrawer's frontend has no installation steps (beside getting the code). To try out some classification services or benchmark them, the backend must however be used. It requires [python 3.6+](https://www.python.org/downloads/) and [pip3](https://pypi.org/project/pip/) installed, and the command below to be run. Note that TeXdrawer has only been tested on Linux at this time.

```
pip3 install -r backend/requirements.txt
```

For TeXdrawer to be able to test/benchmark other services, further installation steps are required:

### hwrt

```
pip3 install hwrt==0.2.1
```

### detexify

The project backend needs to be cloned. However, the *master* branch seems to not work properly, so a slightly modified version of the *stack* branch is used. For increased stability, the [docker](https://docs.docker.com/engine/install) build is used, be sure to have it installed.

```sh
git clone https://github.com/kirel/detexify-hs-backend.git
cd detexify-hs-backend
git checkout stack
git checkout e6c65b3ef1ed5307fb8f15708b09cd11811ef7b3 # in case further commits are added.
```

Then, replace the content of the file ``` detexify-hs-backend.cabal ``` with the following:

```
name:                detexify-hs-backend
version:             0.1.0.0
build-type:          Simple
cabal-version:       >=1.10

executable detexify-hs-backend
  hs-source-dirs: src
  main-is:             Webserver.hs
  build-depends:
    base >=4.7 && <4.8
    , containers >=0.5 && <0.6
    , array >=0.5 && <0.6
    , scotty ==0.11.0
    , mtl ==2.2.1
    , stm ==2.4.4.1, http-types ==0.9.1
    , aeson ==0.11.2.0, bytestring ==0.10.6.0
  default-language:    Haskell2010
```

Finally run:

```sh
sudo sh run.sh
```

Note that detexify docker image roughlty weights 3.6 GB, be sure to have enough disk space.


## Usage

### TeXdrawer

To run the frontend without backend, simply open the ``` frontend/index.html ``` file with any (recent) web browser. To launch the backend, run:

```sh
cd backend
python3 server.py
```

The frontend is then reachable at ``` http://localhost:5050/app ```. Note that the frontend can work offline now, for files may either be loaded locally or fetched from the backend, if necessary.


### hwrt

This service supports 378 symbols (counting the ``` ::MULTISYMBOL:: ``` one), most of which are also supported by detexify. Most common symbols supported by hwrt but not by detexify are digits and the latin alphabet, along with ``` < ``` and ``` > ```.

To run it, use the command below. The service should be usable at ``` http://localhost:5000 ```:

```
hwrt serve
```


### detexify

This service supports 1077 math symbols. To run it, use the command below. To make sure the service is running, check ``` http://localhost:3000 ```.

```sh
sudo sh run.sh
```


## Benchmarks

Benchmarks of the classification capabilities of the previous services have been done, and their results are saved in ``` backend/stats/ ```. Note however that:
- Some symbols (e.g ``` \sum ``` and ``` \Sigma ```) look almost the same, others are very similar. To solve this issue, an optional symbol mapping mechanism has been implemented. It allows to regroup such symbols in same classes, thus helping the classifiers.
- Many classes have too few samples, their recall score is probably highly inaccurate.
- Detexify: training seems to have been done only on the first 20K of the 210454 samples. Here, testing has been done on the last 20K samples (this took ~ 40 minutes). Only 970 of the 1077 symbols are present in those test samples.

For both services, new samples need to be created in order to have a more robust validation.


## Limitations

- At the present time, it doesn't seem possible to containerize TeXdrawer's backend using *Docker* while still being able to send requests to all supported services. The issue is that a Docker container cannot out of the box reach an appliction running on the host local network, at least in a *portable* way... To fix this, all supported services should be containerized, and placed on the same network as TeXdrawer. This would require to modify some of those services, e.g the Flask server of hwrt should be made to run on ``` host='0.0.0.0' ```.
- Some math symbols are not currently rendered by MathJax (typically, those from custom packages, but also rather common ones like ``` \AE ``` or ``` \pounds ```). Still, some efforts have been done to draw them, given a valid unicode value and using the drawSample() function, yet this may be imperfect depending on the web browser, e.g in Firefox with symbols such as ``` \llbracket ``` of unicode ``` U+27E6 ```. Furthermore, this is slow and cannot be used to draw large quantities of symbols. Not drawable symbols have to be skipped during dataset creation.


## Roadmap

- Allow to generate balanced datasets of symbols, for chosen symbol types.
- Enable to visualize such a dataset, an search symbols inside.
- Benchmark the tested services with as less bias as possible.
- Build the best service for symbols classification on the desired task. Support small rotations of symbols.
- Allow to generate datasets of formulas from symbols strokes.
- Extend the recognition to words or formulas.


## External links

- hwrt:
  - [webpage](http://write-math.com/)
  - [documentation](https://pythonhosted.org/hwrt)
  - [source code](https://github.com/MartinThoma/hwrt)
  - [by same author](https://github.com/MartinThoma/write-math)
  - [dataset](http://www.martin-thoma.de/write-math/data)

- Detexify:
  - [webpage](http://detexify.kirelabs.org/classify.html)
  - [frontend code](https://github.com/kirel/detexify)
  - [backend code](https://github.com/kirel/detexify-hs-backend)
  - [dataset](https://github.com/kirel/detexify-data)

- Other resources:
  - Imgage to markup model: [here](https://github.com/harvardnlp/im2markup)
  - OCR dataset: 100K latex formulas + images: [here](https://www.kaggle.com/datasets/shahrukhkhan/im2latex100k) and [here](https://im2markup.yuntiandeng.com/data/)
  - Another 100K: [here](https://www.kaggle.com/datasets/aidapearson/ocr-data)
  - 11K dataset with strokes: [here](https://www.kaggle.com/datasets/rtatman/handwritten-mathematical-expressions)
