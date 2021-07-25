import traceback, json
from collections import OrderedDict

# Backend code:
import loader, mappings


# Translates strokes between 2 supported formats:
# [x, y, t] <-> {'x': x, 'y': y, 'time': t}
def formatStrokesTo(dest_service, strokes):
	try:
		if dest_service == 'hwrt':
			formatPoint = lambda point : {'x' : point[0], 'y': point[1], 'time': point[2]}
		elif dest_service == 'detexify':
			formatPoint = lambda point : [point['x'], point['y'], point['time']] # N.B: t/time unused by detexify.
		else:
			print('Unsupported service:', dest_service)
			return []
		newStrokes = []
		for stroke in strokes:
			newStroke = []
			for point in stroke:
				newStroke.append(formatPoint(point))
			newStrokes.append(newStroke)
		return newStrokes
	except Exception:
		print('Strokes already in correct format.')
		return strokes


# Formatting a classification request, to be sent to the given service.
# Note: no need to use formatStrokesTo(), for strokes should already be in correct format.
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


# Regrouping answers according to the given mapping, scores update, and unicode fetching.
# When 'pretty' is enabled, scores are formatted to strings using formatScore():
def aggregateAnswers(service, mapping, answers, pretty=False):
	try:
		latexToUnicodeMap = loader.getLatexToUnicodeMap()
		aggregated = OrderedDict() # keeping the same order for scores!
		for guess in answers:
			symbol_class = mappings.getProjectedSymbol(guess['raw_answer'], mapping)
			if not symbol_class in aggregated:
				guess = guess.copy() # preventing side effects.
				guess['symbol_class'] = symbol_class
				if symbol_class in latexToUnicodeMap:
					guess['unicode'] = latexToUnicodeMap[symbol_class]
				aggregated[symbol_class] = guess
			elif service == 'hwrt':
				aggregated[symbol_class]['score'] += guess['score']
			elif service == 'detexify':
				aggregated[symbol_class]['score'] = min(aggregated[symbol_class]['score'], guess['score']) # min distance
			else:
				print('Unsupported service:', service)
				return []
		if pretty:
			for symbol_class in aggregated:
				aggregated[symbol_class]['score'] = formatScore(service, aggregated[symbol_class]['score'])
		return list(aggregated.values())
	except:
		print('Unknown error happened while aggregating some answers.')
		print(traceback.format_exc())
		return []


# Truncating scores to be nicely rendered - a string is returned!
def formatScore(service, score):
	if service == 'hwrt':
		return "%.1f %%" % (100. * score)
	elif service == 'detexify':
		return "%.3f" % score
	else:
		print('Unsupported service:', service)
		return str(score)


# Supporting both old and new versions of detexify:
def extractLatexCommand_detexify(string):
	symbol = string.split('-', maxsplit=2)[-1]
	symbol = symbol.replace('_', '\\')
	if symbol == '\\\\':
		return '\\_'
	return symbol


if __name__ == '__main__':

	inputStrokes = [[{"x":50,"y":60,"time":123456}, {"x":30,"y":15,"time":123457}], [{"x":60,"y":55,"time":123458}]]
	strokes = formatStrokesTo('hwrt', inputStrokes) # same strokes
	strokes = formatStrokesTo('detexify', strokes)
	strokes = formatStrokesTo('hwrt', strokes)
	if strokes != inputStrokes:
		print('Error found in formatStrokesTo()')

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
