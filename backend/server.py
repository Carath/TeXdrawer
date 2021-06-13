import os, traceback, json
from flask import Flask, request, Response, jsonify, send_from_directory, redirect
from flask_cors import CORS
import requests

# Backend code:
import formatter, loader

filePath = os.path.dirname(os.path.realpath(__file__))
# print('File path:', filePath, '\n')

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app) # enables CORS for all routes.


def handleError(errorMessage, statusCode):
	''' Prints in the server logs the error message, and returns it as response. '''
	print(errorMessage)
	return Response(errorMessage, content_type='text/plain; charset=UTF-8', status=statusCode)


@app.route('/')
@app.route('/hello')
def helloWorld():
	''' To check if the server is reachable: '''
	return jsonify({'Hello': 'World'}) # shorter than json.dumps() + Response()


@app.route('/app')
@app.route('/api')
def serveWebpage():
	''' Sends static resources used for a webpage. '''
	return send_from_directory(app.static_folder, 'index.html')


@app.route('/routes', methods=['GET'])
@app.route('/sitemap', methods=['GET'])
def getRoutes():
	''' Returns a json containing all the server routes. '''
	routes = {}
	for r in app.url_map._rules:
		routes[r.rule] = {}
		routes[r.rule]['functionName'] = r.endpoint
		routes[r.rule]['methods'] = list(r.methods)
	return jsonify(routes)


@app.route('/get/<name>', methods=['GET'])
def testGET(name):
	''' Example of GET request. '''
	return 'Look at this => %s' % name


@app.route('/post', methods=['POST'])
def testPOST():
	''' Example of POST request. Body must be in json, with a field 'name'. '''
	try:
		# print('\nRequest method: %s\nRequest content type: %s\n' % (request.method, request.content_type))
		foundName = request.json['name']
		jsonified = json.dumps({'foundName': foundName})
		return Response(jsonified, content_type='application/json')
	except Exception as e:
		return handleError('Unknown error in testPOST():\n' + traceback.format_exc(), 500)


# Careful: all URL to which requests will be redirected _must_ be hardcoded (security issues).

@app.route('/redirect-example', methods=['GET', 'POST'])
def redirectionTest():
	''' Redirects a request. Unlike using redirectCrossOrigin(), this cannot solve CORS issues. '''
	url = 'https://polyfill.io/v3/polyfill.min.js' # this site enables cross-origin requests.
	# HTTP status 307 to avoid POST calls to be changed to GET:
	return redirect(url, code=307)


@app.route('/symbols/<serviceName>', methods=['GET'])
def frontendGetSymbols(serviceName):
	''' Returns a sorted list of supported symbols for the given service. '''
	try:
		symbols = loader.getSymbolsSorted(serviceName)
		return jsonify(symbols)
	except Exception as e:
		return handleError('Unknown error in frontendGetSymbols():\n' + traceback.format_exc(), 500)


@app.route('/classify', methods=['POST'])
def frontendClassifyRequest():
	''' Sends the frontend's request to the chosen service: '''
	try:
		receivedInput = extractRequestData(request)
		# print('receivedInput:', receivedInput)
		serviceName = receivedInput['serviceName']
		strokes = receivedInput['strokes']
		result, status = classifyRequest(serviceName, strokes)
		if status != 200:
			return handleError('Failure from classifyRequest()', status)
		return jsonify(result)
	except Exception as e:
		return handleError('Unknown error in frontendClassifyRequest():\n' + traceback.format_exc(), 500)


def classifyRequest(serviceName, strokes):
	''' Send a classification request to the chosen service. '''
	try:
		headers = {}
		if serviceName == 'hwrt':
			formattedRequest = formatter.formatRequest_hwrt(strokes)
			# url = 'http://write-math.com/worker' # website - fails
			url = 'http://localhost:5000/worker' # local
			response = requests.post(url=url, headers=headers, data=formattedRequest)
			result = formatter.extractAnswer_hwrt(response.json())
		elif serviceName == 'detexify':
			formattedRequest = formatter.formatRequest_detexify(strokes)
			# url = 'http://detexify.kirelabs.org/api/classify' # website - fails (old version)
			url = 'http://localhost:3000/classify' # local (from branch 'stack')
			response = requests.post(url=url, headers=headers, json=formattedRequest)
			result = formatter.extractAnswer_detexify(response.json())
		else:
			print('Unsupported service name: ', serviceName)
			return ([], 404)
		return (result, 200)
	except Exception as e:
		print('-> %s service not available.' % serviceName)
		return ([], 500)


def redirectCrossOrigin(url, request):
	''' Redirects a request to another URL, removes CORS issues: '''
	try:
		if request.method == 'POST':
			requestData = extractRequestData(request)
			# print('requestData:  %s\n' % requestData)
			response = requests.post(url=url, headers=request.headers, data=requestData)
		elif request.method == 'GET':
			response = requests.get(url=url)
		elif request.method == 'HEAD':
			response = requests.head(url=url)
		else:
			return handleError('Unsupported HTTP method: ' + request.method, 405)
		return Response(response)
	except Exception as e:
		return handleError('Failed to send a HTTP request to: ' + url, 404)


def extractRequestData(request):
	''' Tries to extract a request data depending on its content-type: '''
	try:
		contentType = request.content_type
		# print('\ncontentType:', contentType)
		if contentType and 'application/json' in contentType:
			return request.json
		elif contentType and 'application/x-www-form-urlencoded' in contentType:
			return request.get_json(force=True)
		elif contentType and ('text/plain' in contentType or 'text/html' in contentType):
			return request.data.decode()
		else:
			print('Unsupported content-type in request data extraction:', contentType)
			return None
	except Exception as e:
		print('Failed to extract a request data.')
		return None


# Set debug=True to not have to restart the server for code changes
# to take effects. Careful though, this can cause security issues!
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5050, debug=False) # '0.0.0.0' works both with and without docker.
