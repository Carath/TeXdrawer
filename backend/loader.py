# Backend code:
import formatter


datasetDir_hwrt = '../datasets/hwrt/'
symbolsMap_hwrt = datasetDir_hwrt + 'symbols.csv'
trainDatasetPath_hwrt = datasetDir_hwrt + 'train-data.csv'
testDatasetPath_hwrt = datasetDir_hwrt + 'test-data.csv'

datasetDir_detexify = '../datasets/detexify/'
symbolsMap_detexify = datasetDir_detexify + 'symbols.txt'
datasetPath_detexify = datasetDir_detexify + 'detexify.sql' # train & test from same file...


def getFileContent(filename):
	file = open(filename, 'r')
	content = file.read()
	file.close()
	# print(content)
	return content


# Note: for .csv files, getLines() is 2 times faster than using csv.reader()!
def getLines(filename):
	return getFileContent(filename).splitlines()


# content: string
def writeContent(filename, content):
	file = open(filename, 'w')
	file.write(content)
	file.close()
	print('Done writing to:', filename)


# Returns a sorted list of the supported symbols:
def getSymbolsSorted(service):
	return sorted(getSymbolsSet(service))


# Returns a set of the supported symbols:
def getSymbolsSet(service):
	return set(getSymbolsMap(service).values())


# Returns a map of the supported symbols. Used for parsing datasets:
def getSymbolsMap(service):
	symbolMap = {}
	if service == 'hwrt':
		lines = getLines(symbolsMap_hwrt)
		for line in lines[1:]:
			splitted = line.split(';')
			symbolMap[splitted[0]] = splitted[1] # id -> latex_command
	elif service == 'detexify':
		lines = getLines(symbolsMap_detexify)
		for line in lines:
			symbolMap[line] = line # latex_command -> latex_command
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
	symbolMap = getSymbolsMap(service)
	lines = getLines(datasetPath)
	foundClasses, dataset = set(), [] # dataset will be a list of (latex_command, strokes string)
	if service == 'hwrt':
		for line in lines[1:]:
			splitted = line.split(';')
			latex_command = getSymbolName(symbolMap, splitted[0])
			foundClasses.add(latex_command)
			dataset.append((latex_command, splitted[2]))
	elif service == 'detexify':
		for start in range(len(lines)):
			if 'COPY samples' in lines[start]:
				break
		for rank in range(start+1, len(lines)):
			if '\\.' in lines[rank]: # reached the end.
				break
			splitted = lines[rank].split('\t')
			latex_command = formatter.extractLatexCommand_detexify(splitted[1])
			foundClasses.add(latex_command)
			dataset.append((latex_command, splitted[2]))
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
