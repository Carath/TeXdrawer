import traceback, json
from collections import OrderedDict

# Backend code:
import loader, mappings


# Formatting a classification request, to be sent to the given service:
def formatRequest(service, strokes):
	if service == 'hwrt':
		return {'secret': '', 'classify': json.dumps(strokes)} # secret not used.
	elif service == 'detexify':
		# Note: detexify should receive 't' keys instead of 'time', but doesn't use them...
		return {'strokes': strokes}
	else:
		print('Unsupported service:', service)
		return {}


def createGuess(dataset_id, raw_answer, score):
	return {
		'dataset_id': dataset_id,
		'symbol_class': raw_answer,
		'raw_answer': raw_answer,
		'unicode': 'U+0', # default
		'package': '', # default
		'score': score
	}


# Extracting data from the given service answer:
def extractServiceAnswer(service, answer):
	try:
		formattedAnswer = []
		if service == 'hwrt':
			for symbol in answer:
				# First semantic only. Overall separator is ';;':
				semantic = symbol['semantics'].split(';')
				formattedAnswer.append(createGuess(
					dataset_id = semantic[0],
					raw_answer = semantic[1],
					score = symbol['probability']
				))
		elif service == 'detexify':
			# Supporting both old and new versions of detexify:
			if 'results' in answer:
				answer = answer['results']
			for symbol in answer:
				formattedAnswer.append(createGuess(
					dataset_id = 0,
					raw_answer = extractLatexCommand_detexify(symbol['id']),
					score = symbol['score']
				))
		else:
			print('Unsupported service:', service)
		return formattedAnswer
	except:
		print('Unknown error happened while extracting data from an answer.')
		print(traceback.format_exc())
		return []


# Regrouping answers according to the given mapping, scores update, and unicode fetching:
def aggregateAnswers(service, mapping, answers):
	try:
		latexToUnicodeMap = loader.getLatexToUnicodeMap()
		aggregated = OrderedDict() # keeping the same order for scores!
		for guess in answers:
			symbol_class = mappings.getProjectedSymbol(guess['raw_answer'], mapping)
			if not symbol_class in aggregated:
				aggregated[symbol_class] = guess
				guess['symbol_class'] = symbol_class
				if symbol_class in latexToUnicodeMap:
					guess['unicode'] = latexToUnicodeMap[symbol_class]
			elif service == 'hwrt':
				aggregated[symbol_class]['score'] += guess['score']
			elif service == 'detexify':
				aggregated[symbol_class]['score'] = min(aggregated[symbol_class]['score'], guess['score']) # min distance
			else:
				print('Unsupported service:', service)
				return []
		return list(aggregated.values())
	except:
		print('Unknown error happened while aggregating some answers.')
		print(traceback.format_exc())
		return []


##################################################
# detexify specific:

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
