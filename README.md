# TeXdrawer

The goal of this small tool is to help building balanced datasets of handwritten LaTeX symbols.


## Installation

For now, the frontend requires no installation steps. The backend however, needs ``` python 3.6+ ``` and ``` pip3 ``` installed. Furthermore, the following command must be run:

```
pip3 install -r backend/requirements.txt
```


## Usage

To run the frontend without backend, simply open the ``` frontend/index.html ``` file with any (recent) web browser. To launch the backend, run:

```
python3 backend/server-flask.py
```

The frontend is then reachable at ``` http://localhost:5050/app ```.


## TODO

- Add a metadata about the maximum 'size' of a symbol to the json output (max number of strokes / max stroke size / max samplesNumber).
- Format compatibility with detexify/hwrt?
- Hardcode canvas size for compatibility? (hwrt: width=400, height=400)
- Process received data from detexify/hwrt.
- Enable to save new datasets on the backend?


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
