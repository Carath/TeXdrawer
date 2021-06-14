# TeXdrawer's backend


## Server

Run the Flask server with ``` python3 server.py ```


## Benchmarks

To benchmark a supported service, run the following command with the service name as arg (here hwrt):

``` python3 benchmark.py hwrt ```


## Requests

Here are listed examples of requests, using *curl*, to the supported services:


* TeXdrawer

- Check if the service is running, and get its version:

```
curl http://localhost:5050/
```

- Get the (sorted) list of symbols, supported by the hwrt service:

```
curl http://localhost:5050/symbols/hwrt
```

- Send a classification request to the hwrt service:

```
curl -X POST http://localhost:5050/classify -H 'Content-Type:application/json' -d '{"service":"hwrt","strokes":[[{"x":50,"y":60,"time":123456}]]}'
```

The last two requests are also available for detexify, by just replacing the service name.


* hwrt

- Check if the service is running, and get its version:

```
curl http://localhost:5000/worker
```

- Classify request:

```
curl -X POST http://localhost:5000/worker -H 'Content-Type:application/x-www-form-urlencoded' -d 'classify=[[{"x":50,"y":60,"time":123456}]]'
```


* Detexify (version from *stack* branch):

- Check if the service is running, and get its version:

```
curl http://localhost:3000/
```

- Classify request:

```
curl -X POST http://localhost:3000/classify -H 'Content-Type: application/json' -d '{"strokes":[[{"x":50, "y":60}]]}'
```
