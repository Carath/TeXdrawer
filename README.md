# TeXdrawer

## About

The goal of this small project is (as of now) three-fold:

- Help building *balanced* datasets of handwritten symbols;
- Benchmark existing (open-source) services allowing recognition of handwritten symbols;
- Modify the tested services, or even build new ones, in order to be the most accurate possible for a specified task. The resulting service, should however be relatively lightweight and fast.

Furthermore, even though any type of handwritten symbols could be relevant to this project, the main focus for now is math symbols. Specifically, appart for numbers, latin and greek alphabets, the system should recognized common math symbols and be able to output either their unicode or LaTeX command name.


## Installation

Only Linux is supported as of now. Moreover, ``` python 3.6+ ``` and ``` pip3 ``` must be installed.

* TeXdrawer

For now, the frontend requires no installation steps. The backend however, needs the following command to be run:

```
pip3 install -r backend/requirements.txt
```

For TeXdrawer to be able to test/benchmark other services, further installation steps are required:

* hwrt

```
pip3 install hwrt==0.2.1
```

* detexify

The project backend needs to be cloned. However, the *master* branch seems to not work properly, so a slightly modified version of the *stack* branch is used:

```
git clone https://github.com/kirel/detexify-hs-backend.git
cd detexify-hs-backend
git checkout stack
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

```
sudo sh run.sh
```

Note that detexify docker image roughlty weights 3.6 Gb, be sure to have enough disk space.


## Usage

* TeXdrawer

To run the frontend without backend, simply open the ``` frontend/index.html ``` file with any (recent) web browser. To launch the backend, run:

```
python3 backend/server.py
```

The frontend is then reachable at ``` http://localhost:5050/app ```.

* hwrt

Run the command below. The service should be usable at ``` http://localhost:5000 ```:

```
hwrt serve
```

* detexify

Run the command below. To make sure the service is running, check ``` http://localhost:3000 ```.

```
sudo sh run.sh
```


## Roadmap

- Allow to generate balanced datasets of symbols, for chosen symbol types.
- Enable to visualize such a dataset.
- Benchmark the tested services, with as less bias as possible, on the following objectives:
  - initial service goal
  - service goal weighted by dataset balance
  - custom goal (to be defined)
- Build the best service possible for the desired task.


## Links

Services to benchmark (locally):

- hwrt:
  - [webpage](http://write-math.com/)
  - [documentation](https://pythonhosted.org/hwrt)
  - [source code](https://github.com/MartinThoma/hwrt)
  - [by same author](https://github.com/MartinThoma/write-math)

- Detexify:
  - [webpage](http://detexify.kirelabs.org/classify.html)
  - [frontend code](https://github.com/kirel/detexify)
  - [backend code](https://github.com/kirel/detexify-hs-backend)
  - [dataset](https://github.com/kirel/detexify-data)
