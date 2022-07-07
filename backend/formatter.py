import traceback, json, copy, math
from collections import OrderedDict

# Backend code:
import loader, mappings


# Get a string from a JSON object, with each first order object being separated by a newline:
def peculiarJsonString(jsonObj, keysFilteringFunction=None, keysSortingFunction=None, reverse=False, indent='', compact=False):
	separators = (',', ':') if compact else None
	processedKeys = jsonObj if type(jsonObj) == list else jsonObj.keys()
	if keysFilteringFunction != None:
		processedKeys = filter(keysFilteringFunction, processedKeys)
	if keysSortingFunction != None:
		if keysSortingFunction == 'key':
			keysSortingFunction = lambda key : key
		processedKeys = sorted(processedKeys, key=keysSortingFunction, reverse=reverse)
	if type(jsonObj) == list:
		entryList = [ indent + json.dumps(row, separators=separators) for row in processedKeys ]
	else:
		entryList = [ indent + json.dumps(key) + ': ' + json.dumps(jsonObj[key], separators=separators) for key in processedKeys ]
	return '{\n' + ',\n'.join(entryList) + '\n}'


# Strokes compact JSON representation: no spaces between objects.
def compactStrokesString(strokes):
	return json.dumps(strokes, separators=(',', ':'))


# Shifting strokes time to start from 0, assuming
# hwrt strokes format. Strokes are modified:
def reshiftTime(strokesFormat, strokes):
	if strokes == []:
		return
	elif strokes[0] == []:
		print('Invalid stroke:', strokes[0])
		return
	key = 'time' if strokesFormat == 'hwrt' else 0
	timeOffset = strokes[0][0][key]
	for stroke in strokes:
		for point in stroke:
			point[key] -= timeOffset


def getStrokesStats(strokesFormat, strokes):
	(xKey, yKey) = ('x', 'y') if strokesFormat == 'hwrt' else (1, 2)
	xmin, xmax, ymin, ymax = math.inf, -math.inf, math.inf, -math.inf
	for stroke in strokes:
		for point in stroke:
			x, y = point[xKey], point[yKey]
			xmin, xmax, ymin, ymax = min(xmin, x), max(xmax, x), min(ymin, y), max(ymax, y)
	return (xmin, xmax, ymin, ymax)


# Translates strokes between 2 supported formats:
# [x, y, t] <-> {'x': x, 'y': y, 'time': t}
def formatStrokesTo(strokesFormat, strokes):
	try:
		if strokesFormat == 'hwrt':
			formatPoint = lambda point : {'x' : point[0], 'y': point[1], 'time': point[2]}
		elif strokesFormat == 'detexify':
			formatPoint = lambda point : [point['x'], point['y'], point['time']] # N.B: t/time unused by detexify.
		else:
			print('Unsupported service:', strokesFormat)
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
	symbolUnicode = loader.getSymbolUnicode(raw_answer)
	return {
		'dataset_id': dataset_id,
		'symbol_class': raw_answer,
		'unicode': symbolUnicode,
		'score': score,
		'raw_answers': [{'symbol_class': raw_answer, 'unicode': symbolUnicode, 'score': score}],
		'package': '' # default
	}


# Extracting data from the given service answer:
def extractServiceAnswer(service, answer):
	try:
		# print('Raw %s service answer:' % service, answer)
		formattedAnswer = []
		if service == 'hwrt':
			for symbol in answer:
				# First semantic only. Overall separator is ';;':
				semantic = symbol['semantics'].split(';')
				formattedAnswer.append(createGuess(
					dataset_id = int(semantic[0]),
					raw_answer = semantic[1],
					score = symbol['probability']
				))
		elif service == 'detexify':
			# Supporting both old and new versions of detexify:
			if 'results' in answer:
				answer = answer['results']
			for symbol in answer:
				formattedAnswer.append(createGuess(
					dataset_id = -1,
					raw_answer = extractLatexCommand_detexify(symbol['id']),
					score = symbol['score']
				))
		else:
			print('Unsupported service:', service)
		return formattedAnswer
	except:
		print('Unknown error happened while extracting data from an answer.\n\n' + traceback.format_exc())
		return []


# Regrouping answers according to the given mapping, scores update, and unicode fetching.
# Optional args: 'bound' to limit bandwidth usage by bounding the number of returned results,
# and 'pretty' to format classes scores as strings using formatScore():
def aggregateAnswers(service, mapping, answers, bound=0, pretty=False):
	try:
		aggregated = OrderedDict() # keeping the same order for scores!
		for guess in answers:
			symbol_class = mappings.getProjectedSymbol(guess['symbol_class'], mapping)
			if not symbol_class in aggregated:
				guess = copy.deepcopy(guess) # preventing side effects.
				guess['symbol_class'] = symbol_class
				guess['unicode'] = loader.getSymbolUnicode(symbol_class)
				aggregated[symbol_class] = guess
			else:
				aggregated[symbol_class]['raw_answers'].append(guess['raw_answers'][0]) # theres only one raw answer here.
				# Updating class score:
				if service == 'hwrt':
					aggregated[symbol_class]['score'] += guess['score']
				elif service == 'detexify':
					aggregated[symbol_class]['score'] = min(aggregated[symbol_class]['score'], guess['score']) # min distance
				else:
					print('Unsupported service:', service)
					return []
		aggregated = list(aggregated.values())
		if service == 'hwrt': # order may have changed after projection since scores are summed.
			aggregated = sorted(aggregated, key=lambda guess : guess['score'], reverse=True)
		if bound > 0:
			aggregated = aggregated[:bound] # done after each classes score has been aggregated.
		if pretty:
			for guess in aggregated:
				guess['score'] = formatScore(service, guess['score'])
		return aggregated
	except:
		print('Unknown error happened while aggregating some answers.\n\n' + traceback.format_exc())
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
