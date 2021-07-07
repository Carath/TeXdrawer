import os, json
from pathlib import Path

# Backend code:
import formatter


symbolsDir = Path('../symbols/')
datasetDir = Path('../datasets/')
statsDir = Path('stats/')

symbolsListsDir = symbolsDir / 'services'
mappingsDir = symbolsDir / 'mappings'

latexToUnicodeTable = symbolsDir / 'latex2unicode.csv'

symbolsMap_hwrt = datasetDir / 'hwrt' / 'symbols.csv'
trainDatasetPath_hwrt = datasetDir / 'hwrt' / 'train-data.csv'
testDatasetPath_hwrt = datasetDir / 'hwrt' / 'test-data.csv'

symbolsMap_detexify = datasetDir / 'detexify' / 'symbols.txt'
datasetPath_detexify = datasetDir / 'detexify' / 'detexify.sql' # train & test from same file.


def getFileContent(path):
	file = open(path, 'r')
	content = file.read()
	file.close()
	# print(content)
	return content


# Note: for .csv files, getLines() + splitting is 2 times faster than using csv.reader()!
def getLines(path):
	return getFileContent(path).splitlines()


# content: string
def writeContent(path, content):
	file = open(path, 'w')
	file.write(content)
	file.close()
	print('Done writing to:', path)


def getLatexToUnicodeMap():
	latexToUnicodeMap = {}
	lines = getLines(latexToUnicodeTable)[1:]
	for line in lines:
		latex, unic = line.split('\t')
		latexToUnicodeMap[latex] = unic
	return latexToUnicodeMap


def getSupportedMappings():
	mappingFiles = os.listdir(mappingsDir)
	mappingFiles = list(filter(lambda file : '.json' in file, mappingFiles))
	mappingFiles = list(map(lambda file : file.split('.json')[0], mappingFiles))
	return ['none'] + list(filter(lambda file : file != '', mappingFiles))


# Returns a sorted list of the supported symbols by the given service:
def getSymbolsSorted(service):
	return sorted(getSymbolsSet(service))


# Returns a set of the supported symbols by the given service.
# This must not rely on getSymbolsDatasetMap(), for symbols list files must follow the same pattern.
def getSymbolsSet(service):
	return set(getLines(symbolsListsDir / (service + '.txt')))


# Returns a map of the supported symbols. Used for parsing datasets:
def getSymbolsDatasetMap(service):
	symbolMap = {}
	if service == 'hwrt':
		lines = getLines(symbolsMap_hwrt)
		for line in lines[1:]:
			splitted = line.split(';')
			symbolMap[splitted[0]] = splitted[1] # id -> symbol
	elif service == 'detexify':
		lines = getLines(symbolsMap_detexify)
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
	print('-> Loading the dataset from:', datasetPath)
	symbolMap = getSymbolsDatasetMap(service)
	lines = getLines(datasetPath)
	foundClasses, dataset = set(), [] # dataset will be a list of string couples: (symbol name, strokes)
	if service == 'hwrt':
		for line in lines[1:]:
			splitted = line.split(';')
			symbol = getSymbolName(symbolMap, splitted[0])
			foundClasses.add(symbol)
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
			foundClasses.add(symbol)
			dataset.append((symbol, splitted[2]))
	else:
		print('Unsupported service:', service)

	# Checking all dataset symbols are supported:
	serviceClasses = set(symbolMap.values())
	unknownSymbols = foundClasses.difference(serviceClasses)
	if unknownSymbols != set():
		print("%d unsupported symbols by service '%s' found in the dataset:"
			% (len(unknownSymbols), service), '', *unknownSymbols, '', sep='\n')
	print('Loaded %d samples.' % len(dataset))
	print('Found %d classes.\n' % len(foundClasses))
	# print('Dataset preview:', *dataset[:10], sep="\n\n")
	# print('Classes:', *foundClasses, sep='\n')
	return foundClasses, dataset


if __name__ == '__main__':
	foundClasses, testDataset = loadDataset('hwrt', testDatasetPath_hwrt)
	firstSymbol, strokesString = testDataset[0]
	strokes = json.loads(strokesString)
	firstStrokeString = json.dumps(strokes[0], indent='  ')
	# N.B: remove indent=... to minify. Other useful options of json.dumps(): ensure_ascii=..., sort_keys=...

	print('First symbol from hwrt test dataset: %s\nIts first stroke:\n\n%s' % (firstSymbol, firstStrokeString))
