import json

# Backend code:
import loader, mappings


def createGuess(dataset_id, latex_command, unicode_dec, package, symbol_class, score):
	guess = {}
	guess['dataset_id'] = dataset_id
	guess['latex_command'] = latex_command
	guess['unicode_dec'] = unicode_dec
	guess['package'] = package
	guess['symbol_class'] = symbol_class
	guess['score'] = score
	return guess


def aggregateAnswers(service, mapping, answers):
	try:
		aggregated = {}
		for guess in answers:
			symbol = guess['latex_command']
			symbol = mappings.getProjectedSymbol(symbol, mapping)
			if not symbol in aggregated:
				aggregated[symbol] = guess
				guess['latex_command'] = symbol
			elif service == 'hwrt':
				aggregated[symbol]['score'] += guess['score']
			elif service == 'detexify':
				aggregated[symbol]['score'] = min(aggregated[symbol]['score'], guess['score']) # min distance
			else:
				print('Unsupported service:', service)
				return []
		return list(aggregated.values()) # No need to sort back this list,
		# since from Python 3.6 onwards, the dict type maintains insertion order.
	except:
		print('Unknown error happened while aggregating some answers.')
		return []

##################################################
# hwrt:

def formatRequest_hwrt(strokes):
	return {'secret': '', 'classify': json.dumps(strokes)} # secret not used.


def extractAnswer_hwrt(hwrt_answer):
	formatted_answer = []
	for symbol in hwrt_answer:
		# First semantic only. Overall separator is ';;':
		semantic = symbol['semantics'].split(';')
		formatted_answer.append(createGuess(
			dataset_id = semantic[0],
			latex_command = semantic[1],
			unicode_dec = semantic[2],
			package = 'null',
			symbol_class = 'null',
			score = symbol['probability']
		))
	return formatted_answer

##################################################
# detexify - from branch 'stack':

# Note: detexify should receive 't' keys instead of 'time', but doesn't use them...
def formatRequest_detexify(strokes):
	return {'strokes': strokes}


# Supporting both old and new versions of detexify:
def extractAnswer_detexify(detexify_answer):
	if 'results' in detexify_answer:
		detexify_answer = detexify_answer['results']
	# print('\ndetexify_answer:', detexify_answer, '\n')
	formatted_answer = []
	for symbol in detexify_answer:
		formatted_answer.append(createGuess(
			dataset_id = 0,
			latex_command = extractLatexCommand_detexify(symbol['id']),
			unicode_dec = 'null',
			package = 'null',
			symbol_class = 'null',
			score = symbol['score']
		))
	return formatted_answer


# Supporting both old and new versions of detexify:
def extractLatexCommand_detexify(string):
	symbol = string.split('-', maxsplit=2)[-1]
	symbol = symbol.replace('_', '\\')
	if symbol == '\\\\':
		return '\\_'
	return symbol


# Translate [x, y, t] points to {'x': x, 'y': y, 'z': z} format:
def formatDatasetStrokes_detexify(datasetStrokes):
	newStrokes = []
	for stroke in datasetStrokes:
		newStroke = []
		for point in stroke:
			newStroke.append({'x' : point[0], 'y': point[1], 't': point[2]}) # N.B: t/time unused here.
		newStrokes.append(newStroke)
	return newStrokes

##################################################

if __name__ == '__main__':

	# Tests which must be passed by Detexify's extractor on both the old
	# and new format. Each test is made of a pair (string, answer):
	extractionTests_detexify = [
		('amssymb-OT1-\\not_sim', '\\not\\sim'), # new
		('amssymb-OT1-\\diagdown', '\\diagdown'), # new
		('latex2e-OT1-\\----', '\\----'), # new
		('latex2e-OT1-\\\\', '\\_'), # new
		('tipa-OT1-_textsca', '\\textsca'), # old
		('latex2e-OT1-_----', '\\----'), # old
		('latex2e-OT1-__', '\\_'), # old
		('latex2e-OT1-]', ']'), # old and new
		('latex2e-OT1-!`', '!`'), # old and new
	]

	errors = 0
	for test in extractionTests_detexify:
		string, answer = test
		output = extractLatexCommand_detexify(string)
		if output != answer:
			print('Extraction failure: %s vs %s' % (output, answer))
			errors += 1
	if errors > 0:
		print('Extraction test failed with %d errors.' % errors)
	else:
		print('Extraction test passed successfully.')
