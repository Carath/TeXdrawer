import os, traceback, json
from pathlib import Path

# Backend code:
import formatter


symbolsDir = Path('../symbols/')
datasetDir = Path('../datasets/')
statsDir = Path('stats/')
answersDir = Path('answers/')
frequenciesDir = Path('frequencies/')
recapDir = Path('recap/')

symbolsListsDir = symbolsDir / 'services'
mappingsDir = symbolsDir / 'mappings'

latexToUnicodePath = symbolsDir / 'latex2unicode.csv'

symbolsMap_hwrt = datasetDir / 'hwrt' / 'symbols.csv'
trainDatasetPath_hwrt = datasetDir / 'hwrt' / 'train-data.csv'
testDatasetPath_hwrt = datasetDir / 'hwrt' / 'test-data.csv'

symbolsMap_detexify = datasetDir / 'detexify' / 'symbols.txt'
datasetPath_detexify = datasetDir / 'detexify' / 'detexify.sql' # train & test from same file.


def getFileContent(path):
	with open(path, "r") as file: # file closed at exit
		content = file.read()
		# print(content)
		return content


# Note: for .csv files, getFileLines() + splitting is 2 times faster than using csv.reader()!
def getFileLines(path):
	return getFileContent(path).splitlines()


# content: string
def writeContent(path, content):
	with open(path, "w") as file: # file closed at exit
		file.write(content)
		print('Done writing to:', path)


_latexToUnicodeMap = {}

# Returns a map to convert latex commands to unicode values:
def getLatexToUnicodeMap():
	try:
		if _latexToUnicodeMap != {}:
			return _latexToUnicodeMap
		lines = getFileLines(latexToUnicodePath)[1:]
		for line in lines:
			latex, unic = line.split('\t')
			_latexToUnicodeMap[latex] = unic
		print('Loaded LaTeX -> unicode map.')
	except:
		print('Could not load the LaTeX -> unicode map from %s' % latexToUnicodePath)
	return _latexToUnicodeMap


def getSymbolUnicode(symbol):
	latexToUnicodeMap = getLatexToUnicodeMap()
	if symbol in latexToUnicodeMap:
		return latexToUnicodeMap[symbol]
	return 'U+0' # default


def getSupportedServices():
	return ['hwrt', 'detexify'] # hardcoded for now, later files in ../symbols/services/ could be listed.


def getSupportedMappings():
	mappingFiles = os.listdir(mappingsDir)
	mappingFiles = [ os.path.splitext(file)[0] for file in mappingFiles if '.json' in file ]
	return ['none'] + [ file for file in mappingFiles if file != '' ]


_symbolsLoader = {}

# Returns a set of the supported symbols by the given service.
# This must not rely on getSymbolsDatasetMap(), for symbols list files must follow the same pattern.
def getSymbolsSet(service):
	try:
		if service in _symbolsLoader:
			return _symbolsLoader[service]
		path = symbolsListsDir / (service + '.txt')
		theSet = set(getFileLines(path))
		print('Loaded symbols for service:', service)
		_symbolsLoader[service] = theSet
		return theSet
	except:
		print('Could not get symbols of service %s from %s' % (service, path))
		return set()


# Returns a sorted list of the supported symbols by the given service:
def getSymbolsSorted(service):
	return sorted(getSymbolsSet(service))


# Returns a map of the supported symbols. Used for parsing datasets:
def getSymbolsDatasetMap(service):
	symbolMap = {}
	if service == 'hwrt':
		lines = getFileLines(symbolsMap_hwrt)
		for line in lines[1:]:
			splitted = line.split(';')
			symbolMap[splitted[0]] = splitted[1] # id -> symbol
	elif service == 'detexify':
		lines = getFileLines(symbolsMap_detexify)
		for line in lines:
			symbolMap[line] = line # symbol -> symbol
	else:
		print('Unsupported service:', service)
	return symbolMap


def getSymbolName(symbolMap, key):
	if symbolMap == {}:
		return key
	elif key in symbolMap:
		return symbolMap[key]
	else:
		print('No symbol found for key:', key)
		return '???'


# Dataset partially loaded: strokes kept as string; use json.loads() to fully get them. Heavy parsing
# will only be done during the benchmark, to enable reading quickly only parts of a dataset:
def loadDataset(service, datasetPath):
	try:
		print("\n-> Loading the dataset for service '%s' from %s" % (service, datasetPath))
		symbolMap = getSymbolsDatasetMap(service)
		lines = getFileLines(datasetPath)
		dataset = [] # dataset will be a list of string couples: (symbol name, strokes)
		if service == 'hwrt':
			for line in lines[1:]:
				splitted = line.split(';')
				symbol = getSymbolName(symbolMap, splitted[0])
				dataset.append((symbol, splitted[2]))
		elif service == 'detexify':
			for start in range(len(lines)):
				if 'COPY samples' in lines[start]:
					break
			for rank in range(start+1, len(lines)):
				if '\\.' in lines[rank]: # reached the end.
					break
				splitted = lines[rank].split('\t')
				symbol = formatter.extractLatexCommand_detexify(splitted[1])
				dataset.append((symbol, splitted[2]))
		else:
			print('Unsupported service:', service)
		print('Loaded %d samples.' % len(dataset))
		return dataset
	except Exception:
		print('\nFailure happened while trying to load a dataset:\n')
		print(traceback.format_exc())
		return []


if __name__ == '__main__':
	testDataset = loadDataset('hwrt', testDatasetPath_hwrt)
	firstSymbol, strokesString = testDataset[0]
	strokes = json.loads(strokesString)
	firstStrokeString = json.dumps(strokes[0], indent='  ')
	# N.B: remove indent=... to minify. Other useful options of json.dumps(): ensure_ascii=..., sort_keys=...

	print('First symbol from hwrt test dataset: %s\nIts first stroke:\n\n%s' % (firstSymbol, firstStrokeString))
