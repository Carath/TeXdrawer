import os, traceback, json
from flask import Flask, request, Response, redirect, jsonify, send_from_directory, send_file
from flask_cors import CORS
import requests
from pathlib import Path

# Backend code:
import loader, formatter, mappings

frontendPath = Path('../frontend/')
libsFrontendPath = Path('../libs-frontend/')

##################################################
# REST API generic functions:

app = Flask(__name__, static_folder=str(frontendPath), static_url_path='')
CORS(app) # enables CORS for all routes.


def handleError(errorMessage, statusCode):
	''' Prints in the server logs the error message, and returns it '''
	''' as a text response with an HTTP error status. '''
	errorMessage += '\n\n' + traceback.format_exc()
	print(errorMessage)
	return Response(errorMessage, content_type='text/plain; charset=UTF-8', status=statusCode)


@app.route('/')
@app.route('/hello')
def hello():
	''' To check if the server is reachable: '''
	return jsonify({'TeXdrawer version': '1.0.0'}) # shorter than json.dumps() + Response()


@app.route('/app')
@app.route('/frontend')
def serveWebpage():
	''' Sends static resources used for a webpage. Unused files are not sent! '''
	return send_from_directory(app.static_folder, 'index.html')


@app.route('/routes', methods=['GET'])
@app.route('/sitemap', methods=['GET'])
def getRoutes():
	''' Returns a json object containing all the server routes. '''
	routes = {}
	for r in app.url_map._rules:
		routes[r.rule] = {
			'functionName': r.endpoint,
			'methods': list(r.methods)
		}
	return jsonify(routes)


# Careful: all URL to which requests will be redirected _must_ be hardcoded (security issues).

@app.route('/redirect-example', methods=['GET', 'POST'])
def redirectionTest():
	''' Redirects a request. Unlike using redirectCrossOrigin(), this cannot solve CORS issues. '''
	url = 'https://polyfill.io/v3/polyfill.min.js' # this site enables cross-origin requests.
	return redirect(url, code=307) # HTTP status 307 to avoid POST calls to be changed to GET.


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
		print('Failed to extract a request data.\n\n' + traceback.format_exc())
		return None

##################################################
# TeXdrawer specific functions:

@app.route('/libs-frontend-directory', methods=['GET'])
@app.route('/libs-frontend-directory/<path:dirPath>', methods=['GET'])
def serveFrontendLibsDir(dirPath='.'):
	''' Returns the list of files and directories from any directory in 'libs-frontend', given its relative path. '''
	try:
		assert '..' not in dirPath, 'Path must not contain double dots!' # just to be sure.
		return jsonify(os.listdir(libsFrontendPath / dirPath))
	except Exception as e:
		return handleError("Error from serveFrontendLibsDir(): directory '%s' not found." % dirPath, 404)


@app.route('/libs-frontend-file/<path:filePath>', methods=['GET'])
def serveFrontendLibsFile(filePath):
	''' Returns any file from the 'libs-frontend' directory, given its relative path. Works in sub directories too. '''
	try:
		assert '..' not in filePath, 'Path must not contain double dots!' # just to be sure.
		return send_file(str(libsFrontendPath / filePath))
	except Exception as e:
		return handleError("Error from serveFrontendLibsFile(): file '%s' not found." % filePath, 404)


@app.route('/latex-to-unicode', methods=['GET'])
def serveLatexToUnicodeMap():
	''' Sends a map to convert latex commands to unicode values. '''
	try:
		return jsonify(loader.getLatexToUnicodeMap())
	except Exception as e:
		return handleError('Unknown error in serveLatexToUnicodeMap().', 500)


@app.route('/services-and-mappings', methods=['GET'])
def serveServicesAndMappingsList():
	''' Returns the lists of supported services and mappings. '''
	try:
		return jsonify({
			'services': loader.getSupportedServices(),
			'mappings': loader.getSupportedMappings()
		})
	except Exception as e:
		return handleError('Unknown error in serveServicesAndMappingsList().', 500)


@app.route('/mapping/classes/<mapping>', methods=['GET'])
def serveMapping(mapping):
	''' Returns the equivalence classes for the given mapping. '''
	try:
		return jsonify(mappings.getMapping(mapping).classes)
	except Exception as e:
		return handleError('Unknown error in serveMapping().', 500)


@app.route('/symbols/<service>', methods=['GET'])
@app.route('/symbols/<service>/<mapping>', methods=['GET'])
def serveProjectedSymbols(service, mapping='none'):
	''' Returns the sorted list of supported symbols and their unicode, for the given service. '''
	''' If a mapping is given, then the projected symbols are returned. '''
	try:
		latexToUnicodeMap = loader.getLatexToUnicodeMap()
		projectedSymbols = mappings.getServiceProjectedSymbolsSorted(service, mapping)
		data = []
		for symbol in projectedSymbols:
			data.append({
				'symbol_class': symbol,
				'unicode': loader.getSymbolUnicode(symbol),
				'package': '',
			})
		return jsonify(data)
	except Exception as e:
		return handleError('Unknown error in serveProjectedSymbols().', 500)


@app.route('/classify', methods=['POST'])
def serveClassifyRequest():
	''' Serves the result of a classification request to a chosen service: '''
	try:
		receivedInput = extractRequestData(request)
		# print('receivedInput:', receivedInput)
		service = receivedInput['service']
		strokes = receivedInput['strokes']
		mapping = receivedInput['mapping'] if 'mapping' in receivedInput else 'none'
		bound = receivedInput['bound'] if 'bound' in receivedInput else 0
		pretty = receivedInput['pretty'] if 'pretty' in receivedInput else False
		answers, status = classifyRequest(service, mapping, strokes, bound=bound, pretty=pretty)
		if status != 200:
			return handleError('Failure from classifyRequest().', status)
		return jsonify(answers)
	except Exception as e:
		return handleError('Unknown error in serveClassifyRequest().', 500)


def classifyRequest(service, mapping, strokes, bound=0, pretty=False):
	''' Sends a classification request to the chosen service. See aggregateAnswers() for args details. '''
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
		answers = formatter.aggregateAnswers(service, mapping, answers, bound=bound, pretty=pretty)
		return (answers, 200)
	except Exception as e:
		print("\n-> '%s' service seems not available.\n" % service)
		# print(traceback.format_exc())
		return ([], 500)


# Set debug=True to not have to restart the server for code changes
# to take effects. Careful though, this can cause security issues!
if __name__ == '__main__':
	app.run(host='0.0.0.0', port=5050, debug=False) # '0.0.0.0' works both with and without docker.
