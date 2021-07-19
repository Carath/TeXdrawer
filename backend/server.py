import os, traceback, json
from flask import Flask, request, Response, jsonify, send_from_directory, redirect
from flask_cors import CORS
import requests
from pathlib import Path

# Backend code:
import loader, formatter, mappings

##################################################
# REST API generic functions:

app = Flask(__name__, static_folder=str(Path('../frontend')), static_url_path='')
CORS(app) # enables CORS for all routes.


def handleError(errorMessage, statusCode):
	''' Prints in the server logs the error message, and returns it as response. '''
	errorMessage += '\n\n' + traceback.format_exc()
	print(errorMessage)
	return Response(errorMessage, content_type='text/plain; charset=UTF-8', status=statusCode)


@app.route('/')
@app.route('/hello')
def helloWorld():
	''' To check if the server is reachable: '''
	return jsonify({'TeXdrawer version': '1.0.0'}) # shorter than json.dumps() + Response()


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
		return handleError('Unknown error in testPOST().', 500)


# Careful: all URL to which requests will be redirected _must_ be hardcoded (security issues).

@app.route('/redirect-example', methods=['GET', 'POST'])
def redirectionTest():
	''' Redirects a request. Unlike using redirectCrossOrigin(), this cannot solve CORS issues. '''
	url = 'https://polyfill.io/v3/polyfill.min.js' # this site enables cross-origin requests.
	# HTTP status 307 to avoid POST calls to be changed to GET:
	return redirect(url, code=307)


def redirectCrossOrigin(url, request):
	''' Redirects a request to another URL, removes CORS issues: '''
	try:
		if request.method == 'POST':
			requestData = extractRequestData(request)
			# print('requestData: %s\n' % requestData)
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
		print(traceback.format_exc())
		return None

##################################################
# TeXdrawer specific functions:

@app.route('/mappings', methods=['GET'])
def frontendGetMappingsList():
	''' Returns the list of available mappings. '''
	try:
		return jsonify(loader.getSupportedMappings())
	except Exception as e:
		return handleError('Unknown error in frontendGetMappingsList().', 500)


@app.route('/mapping/classes/<mapping>', methods=['GET'])
def frontendGetMapping(mapping):
	''' Returns the equivalence classes for the given mapping. '''
	try:
		return jsonify(mappings.getMapping(mapping).classes)
	except Exception as e:
		return handleError('Unknown error in frontendGetMapping().', 500)


@app.route('/services', methods=['GET'])
def frontendGetServices():
	''' Returns the list of supported services. '''
	try:
		return jsonify(['hwrt', 'detexify'])
	except Exception as e:
		return handleError('Unknown error in frontendGetServices().', 500)


@app.route('/symbols/<service>', methods=['GET'])
@app.route('/symbols/<service>/<mapping>', methods=['GET'])
def frontendGetProjectedSymbols(service, mapping='none'):
	''' Returns the sorted list of supported symbols and their unicode, for the given service. '''
	''' If a mapping is given, then the projected symbols are returned. '''
	try:
		latexToUnicodeMap = loader.getLatexToUnicodeMap()
		projectedSymbols = mappings.getServiceProjectedSymbolsSorted(service, mapping)
		data = []
		for symbol in projectedSymbols:
			symbolUnicode = 'U+0' # default
			if symbol in latexToUnicodeMap:
				symbolUnicode = latexToUnicodeMap[symbol]
			data.append({
				'symbol_class': symbol,
				'unicode': symbolUnicode,
				'package': '',
			})
		return jsonify(data)
	except Exception as e:
		return handleError('Unknown error in frontendGetProjectedSymbols().', 500)


@app.route('/classify', methods=['POST'])
def frontendClassifyRequest():
	''' Sends the frontend's request to the chosen service: '''
	try:
		receivedInput = extractRequestData(request)
		# print('receivedInput:', receivedInput)
		service = receivedInput['service']
		strokes = receivedInput['strokes']
		mapping = 'none'
		if 'mapping' in receivedInput:
			mapping = receivedInput['mapping']
		result, status = classifyRequest(service, mapping, strokes)
		if status != 200:
			return handleError('Failure from classifyRequest().', status)
		return jsonify(result)
	except Exception as e:
		return handleError('Unknown error in frontendClassifyRequest().', 500)


def classifyRequest(service, mapping, strokes):
	''' Send a classification request to the chosen service. '''
	try:
		formattedRequest = formatter.formatRequest(service, strokes)
		if service == 'hwrt':
			# url = 'http://write-math.com/worker' # website - fails
			url = 'http://localhost:5000/worker' # local
			response = requests.post(url=url, headers={}, data=formattedRequest)
		elif service == 'detexify':
			# url = 'http://detexify.kirelabs.org/api/classify' # website - fails (old version)
			url = 'http://localhost:3000/classify' # local (from branch 'stack')
			response = requests.post(url=url, headers={}, json=formattedRequest)
		else:
			print('Unsupported service:', service)
			return ([], 404)
		answers = formatter.extractServiceAnswer(service, response.json())
		answers = formatter.aggregateAnswers(service, mapping, answers)
		return (answers, 200)
	except Exception as e:
		print('\n-> %s service seems not available.\n' % service)
		# print(traceback.format_exc())
		return ([], 500)


# Set debug=True to not have to restart the server for code changes
# to take effects. Careful though, this can cause security issues!
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5050, debug=False) # '0.0.0.0' works both with and without docker.
