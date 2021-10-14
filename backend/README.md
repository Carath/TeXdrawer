# TeXdrawer's backend


## Server

Run the Flask server with ``` python3 server.py ```


## Benchmarks

To benchmark a supported service, run the command below with the service name as arg (here ``` hwrt ```).

``` python3 benchmark.py hwrt ```

Furthermore, an optional symbol mapping can also be given (default to ``` none ```):

``` python3 benchmark.py hwrt similar-0 ```

The results will be saved in the ``` stats ``` directory.


## Requests

Below are listed examples of requests allowed by each services:


#### TeXdrawer

- Check if TeXdrawer is running, and get its version:

```
curl http://localhost:5050/
```

- Access the frontend, served by the backend, by opening in a web browser:

```
http://localhost:5050/app
```

- Get the list of javascript libraries used by the frontend and hosted by the backend:

```
curl http://localhost:5050/javascript-libs-list
```

- Get the desired javascript library used by the frontend and hosted by the backend (here jQuery v3.6.0):

```
curl http://localhost:5050/javascript-libs/jquery-3.6.0.min.js
```

- Get a map to convert latex commands to unicode values.

```
curl http://localhost:5050/latex-to-unicode
```

- Get the lists of supported services and mappings:

```
curl http://localhost:5050/services-and-mappings
```

- Get the equivalence classes for the given mapping (here ``` strict-0 ```):

```
curl http://localhost:5050/mapping/classes/strict-0
```

- Get the list of symbols (and their unicode) supported by the given service (here ``` hwrt ```):

```
curl http://localhost:5050/symbols/hwrt
```

- Get the list of projected symbols (and their unicode) for the given service and mapping (here ``` detexify ``` and ``` similar-0 ```):

```
curl http://localhost:5050/symbols/detexify/similar-0
```

- Send a classification request to the given service (here ``` hwrt ```), for the given mapping (here ``` strict-0 ``` - use ``` none ``` to not use any). Optional args: ``` bound ``` to limit bandwidth usage by bounding the number of returned classes, and ``` pretty ``` to truncate scores and send them as strings:

```
curl -X POST http://localhost:5050/classify \
  -H 'Content-Type:application/json' \
  -d '{"service":"hwrt", "mapping":"strict-0", "bound":0, "pretty":true, "strokes":[[{"x":50,"y":60,"time":123456}]]}'
```


#### hwrt

- Check if hwrt is running, and get its version:

```
curl http://localhost:5000/worker
```

- Access the frontend, served by the backend, by opening in a web browser:

```
http://localhost:5000/
```

- Classification request:

```
curl -X POST http://localhost:5000/worker \
  -H 'Content-Type:application/x-www-form-urlencoded' \
  -d 'classify=[[{"x":50,"y":60,"time":123456}]]'
```


#### Detexify (version from *stack* branch):

- Check if detexify is running, and get its version:

```
curl http://localhost:3000/
```

- Classification request:

```
curl -X POST http://localhost:3000/classify \
  -H 'Content-Type: application/json' \
  -d '{"strokes":[[{"x":50, "y":60}]]}'
```
