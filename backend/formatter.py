import json

##################################################
# hwrt:

def formatRequest_hwrt(strokes):
	return {"secret": "", "classify": json.dumps(strokes)}


def extractAnswer_hwrt(hwrt_answer):
	formatted_answer = []
	for symbol in hwrt_answer:
		guess = {}
		guess["latex_command"] = symbol["complete_latex"]
		# First semantic only. Overall separator is ';;':
		guess["unicode_dec"] = symbol["semantics"].split(";")[2]
		guess["class"] = "null"
		guess["score"] = "%.1f %%" % (100. * symbol["probability"])
		formatted_answer.append(guess)
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
		guess = {}
		guess["latex_command"] = extractLatexCommand_detexify(symbol)
		guess["unicode_dec"] = "null"
		guess["class"] = "null"
		guess["score"] = "%.3f" % (symbol["score"])
		formatted_answer.append(guess)
	return formatted_answer

# Supporting both old and new versions of detexify:
def extractLatexCommand_detexify(symbol):
	if "symbol" in symbol:
		return symbol["symbol"]["command"]
	# Careful! Some symbols e.g '[' may not start with '\\':
	return symbol["id"].split('-', maxsplit=2)[-1]
