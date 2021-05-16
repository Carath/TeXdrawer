import json

##################################################
# hwrt:

def formatRequest_hwrt(strokes):
	data = {}
	# data["secret"] = "b2ce3b41-8e43-4c5b-ad97-90ca251aa9d7"; # does not seem to be required...
	data["secret"] = ""
	data["classify"] = json.dumps(strokes)
	return data


def extractAnswer_hwrt(hwrt_answer):
	formatted_answer = []
	for symbol in hwrt_answer:
		guess = {}
		guess["latex_command"] = symbol["complete_latex"]
		guess["unicode_dec"] = symbol["semantics"].split(";")[2] # first semantic only. Overall separator: ';;'
		guess["class"] = "null"
		guess["score"] = symbol["probability"]
		formatted_answer.append(guess)
	return formatted_answer

##################################################
# detexify:

def formatRequest_detexify(strokes): # TODO: check if no further formatting is needed.
	return "strokes=" + json.dumps(strokes)


def extractAnswer_detexify(detexify_answer):
	formatted_answer = []
	for symbol in detexify_answer:
		guess = {}
		guess["latex_command"] = symbol["symbol"]["command"]
		guess["unicode_dec"] = "null"
		guess["class"] = "null"
		guess["score"] = symbol["score"]
		formatted_answer.append(guess)
	return formatted_answer

# TODO: standardize the guess object.
