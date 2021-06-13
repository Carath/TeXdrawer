import json

def createGuess(dataset_id, latex_command, unicode_dec, package, symbol_class, score):
	guess = {}
	guess["dataset_id"] = dataset_id
	guess["latex_command"] = latex_command
	guess["unicode_dec"] = unicode_dec
	guess["package"] = package
	guess["symbol_class"] = symbol_class
	guess["score"] = score
	return guess

##################################################
# hwrt:

def formatRequest_hwrt(strokes):
	return {"secret": "", "classify": json.dumps(strokes)}

def extractAnswer_hwrt(hwrt_answer):
	formatted_answer = []
	for symbol in hwrt_answer:
		# First semantic only. Overall separator is ';;':
		semantic = symbol["semantics"].split(";")
		formatted_answer.append(createGuess(
			dataset_id = semantic[0],
			latex_command = semantic[1],
			unicode_dec = semantic[2],
			package = "null",
			symbol_class = "null",
			score = "%.1f %%" % (100. * symbol["probability"])
		))
	return formatted_answer

##################################################
# detexify - from branch 'stack':

# Note: detexify should receive 't' keys instead of 'time', but doesn't use them...
def formatRequest_detexify(strokes):
	return {"strokes": strokes}

# Supporting both old and new versions of detexify:
def extractAnswer_detexify(detexify_answer):
	if "results" in detexify_answer:
		detexify_answer = detexify_answer["results"]
	# print('\ndetexify_answer:', detexify_answer, '\n')
	formatted_answer = []
	for symbol in detexify_answer:
		formatted_answer.append(createGuess(
			dataset_id = 0,
			latex_command = extractLatexCommand_detexify(symbol["id"]),
			unicode_dec = "null",
			package = "null",
			symbol_class = "null",
			score = "%.3f" % (symbol["score"])
		))
	return formatted_answer

# Supporting both old and new versions of detexify:
def extractLatexCommand_detexify(string):
	symbol = string.split('-', maxsplit=2)[-1]
	symbol = symbol.replace('_', '\\')
	if symbol == '\\\\':
		return '\\_'
	return symbol
