# TeXdrawer's backend


## Server

Run the Flask server with ``` python3 server.py ```


## Benchmarks

To benchmark a supported service on all available mappings, make sure it is running and run the command below with the service name as arg (here ``` hwrt ```):

``` python3 benchmark.py hwrt ```

Furthermore, one can also choose to only run this benchmark on some selected mappings, to do so their names must be passed as further args (here only ``` similar-0 ``` is specified):

``` python3 benchmark.py hwrt similar-0 ```

Note that the ``` none ``` mapping (i.e no mapping used) will always be added to the mapping list, for reference purposes. Additionally, the benchmark duration is not proportional to the number of mappings used, however adding mappings can make it slightly longer since more classes may need to be considered.

Stats files will be saved in the ``` stats/ ``` directory, and data on correlated answers in ``` answers/ ```. Finally, data on symbols frequency in each projected classes will be stored in ``` frequencies/ ```.


## Requests

Below are listed examples of requests allowed by each services:


### TeXdrawer

- Check if TeXdrawer is running, and get its version:

```sh
curl http://localhost:5050/
```

- Access the frontend, served by the backend, by opening in a web browser:

```
http://localhost:5050/app
```

- Get the list of files and directories from the 'libs-frontend' directory:

```sh
curl http://localhost:5050/libs-frontend-directory
```

- Get any file (here jQuery v3.6.0) from the 'libs-frontend' directory, given its relative path. Works in sub directories too:

```sh
curl http://localhost:5050/libs-frontend-file/jquery-3.6.0.min.js
```

- Get a map to convert latex commands to unicode values.

```sh
curl http://localhost:5050/latex-to-unicode
```

- Get the lists of supported services and mappings:

```sh
curl http://localhost:5050/services-and-mappings
```

- Get the equivalence classes for the given mapping (here ``` strict-0 ```):

```sh
curl http://localhost:5050/mapping/classes/strict-0
```

- Get the list of symbols (and their unicode) supported by the given service (here ``` hwrt ```):

```sh
curl http://localhost:5050/symbols/hwrt
```

- Get the list of projected symbols (and their unicode) for the given service and mapping (here ``` detexify ``` and ``` similar-0 ```):

```sh
curl http://localhost:5050/symbols/detexify/similar-0
```

- Send a classification request to the given service (here ``` hwrt ```), for the given mapping (here ``` similar-0 ``` - use ``` none ``` to not use any). Optional args: ``` bound ``` to limit bandwidth usage by bounding the number of returned results, and ``` pretty ``` to truncate scores and send them as strings:

```sh
curl -X POST http://localhost:5050/classify \
  -H 'Content-Type:application/json' \
  -d '{"service":"hwrt", "mapping":"similar-0", "bound":0, "pretty":true, "strokes":[[{"x":50,"y":60,"time":0},{"x":55,"y":65,"time":10}],[{"x":55,"y":66,"time":70}]]}'
```

<details>

<summary>The result should look like this (click to expand):</summary>

```json
[
  {
    "dataset_id": 528,
    "package": "",
    "raw_answers": [
      {
        "score": 0.5535228691460732,
        "symbol_class": "\\setminus",
        "unicode": "U+29F5"
      },
      {
        "score": 0.09666091280488973,
        "symbol_class": "\\backslash",
        "unicode": "U+5C"
      }
    ],
    "score": "65.0 %",
    "symbol_class": "\\backslash",
    "unicode": "U+5C"
  },
  {
    "dataset_id": 758,
    "package": "",
    "raw_answers": [
      {
        "score": 0.2947293664945923,
        "symbol_class": "\\searrow",
        "unicode": "U+2198"
      }
    ],
    "score": "29.5 %",
    "symbol_class": "\\searrow",
    "unicode": "U+2198"
  }
]
```

</details>


### hwrt

- Check if hwrt is running, and get its version:

```sh
curl http://localhost:5000/worker
```

- Access the frontend, served by the backend, by opening in a web browser:

```
http://localhost:5000/
```

- Classification request:

```sh
curl -X POST http://localhost:5000/worker \
  -H 'Content-Type:application/x-www-form-urlencoded' \
  -d 'classify=[[{"x":50,"y":60,"time":123456}]]'
```


### Detexify (version from the *stack* branch):

- Check if detexify is running, and get its version:

```sh
curl http://localhost:3000/
```

- Classification request:

```sh
curl -X POST http://localhost:3000/classify \
  -H 'Content-Type: application/json' \
  -d '{"strokes":[[{"x":50, "y":60}]]}'
```
