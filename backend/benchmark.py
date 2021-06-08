import json
from tabulate import tabulate

# Backend code:
import server


datasetDir_hwrt = '../datasets/hwrt/'
symbolsMap_hwrt = datasetDir_hwrt + 'symbols.csv'
trainDatasetPath_hwrt = datasetDir_hwrt + 'train-data.csv'
testDatasetPath_hwrt = datasetDir_hwrt + 'test-data.csv'

datasetDir_detexify = '../datasets/detexify/'
symbolsMap_detexify = datasetDir_detexify + 'symbols.json'
datasetPath_detexify = datasetDir_detexify + 'detexify.sql' # train & test from same file...


def getFileContent(filename):
	file = open(filename, 'r')
	content = file.read()
	file.close()
	# print(content)
	return content

# Note: for .csv files, getLines() is 2 times faster than using csv.reader()!
def getLines(filename):
	file = open(filename, 'r')
	lines = file.read().splitlines()
	file.close()
	# print(lines)
	return lines


# content: string
def writeContent(filename, content):
	file = open(filename, 'w')
	file.write(content)
	file.close()
	print('Done writing to:', filename)


def getSymbolMap(service):
	symbolMap = {}
	if service == 'hwrt':
		lines = getLines(symbolsMap_hwrt)
		for line in lines[1:]:
			splitted = line.split(';')
			symbolMap[splitted[0]] = splitted[1]
		return symbolMap
	elif service == 'detexify':
		# lines = getLines(symbolsMap_detexify)
		# content = getFileContent(symbolsMap_detexify)
		# print(content[:100])
		# print('lines:', *lines, sep='\n')
		# content = json.loads(content)
		# print(len(content))
		return {} # no map needed!
	else:
		print('Unsupported service:', service)
		return {}


def getSymbolName(symbolMap, key):
	if symbolMap == {}:
		return key
	elif key in symbolMap:
		return symbolMap[key]
	else:
		print('No symbol found for key:', key)
		return '???'


def format_detexify_strokes(strokes):
	newstrokes = []
	for stroke in strokes:
		newstroke = []
		for point in stroke:
			newstroke.append({'x' : point[0], 'y': point[1], 't': point[2]}) # N.B: t/time unused here.
		newstrokes.append(newstroke)
	return newstrokes


# Will replace the one in formatter:

def extract_detexify_symbol(string):
	symbol = string.split('-', maxsplit=2)[-1]
	if symbol[0] == '_' and len(symbol) > 1:
		return '\\' + symbol[1:]
	return symbol


# Dataset entries loaded as string. Heavy parsing will only be done during
# the benchmark, to enable reading quickly only parts of a dataset:
def loadDataset(service, datasetPath):
	print('Loading the dataset from:', datasetPath)
	lines = getLines(datasetPath)
	classes, dataset = set(), [] # dataset will be a list of (latex_command, strokes string)
	if service == 'hwrt':
		symbolMap = getSymbolMap(service)
		for line in lines[1:]:
			splitted = line.split(';')
			latex_command = getSymbolName(symbolMap, splitted[0])
			classes.add(latex_command)
			dataset.append((latex_command, splitted[2]))
	elif service == 'detexify':
		for start in range(len(lines)):
			if 'COPY samples' in lines[start]:
				break
		for rank in range(start+1, len(lines)):
			if '\\.' in lines[rank]: # reached the end.
				break
			splitted = lines[rank].split('\t')
			latex_command = extract_detexify_symbol(splitted[1])
			classes.add(latex_command)
			dataset.append((latex_command, splitted[2]))
	else:
		print('Unsupported service:', service)
	print('Loaded %d samples.' % len(dataset))
	print('Found %d classes.' % len(classes))
	# print('Dataset preview:', *dataset[:10], sep="\n\n")
	# print('Classes:', *classes, sep='\n')
	return classes, dataset


# Benchmarks the classification capabilities of the given service:
def benchmark(service, dataset, top_k):
	print('Starting the benchmark...')
	accuracyMap = {}
	samplesNumber = len(dataset)
	for rank in range(samplesNumber):
		key, strokes = dataset[rank]
		strokes = json.loads(strokes)
		if service == 'detexify':
			strokes = format_detexify_strokes(strokes)
		# print(key, strokes)
		result, status = server.classifyRequest(service, strokes)
		# print('result:', result)
		if status != 200:
			print('ERROR at rank:', rank)
			break
		if not key in accuracyMap:
			accuracyMap[key] = [0] * (top_k+1) # sample and top_k success number
		accuracyMap[key][0] += 1
		max_results = min(top_k, len(result))
		for i in range(max_results):
			if key == result[i]['latex_command']:
				accuracyMap[key][i+1] += 1
				break
	aggregateStats(service, top_k, samplesNumber, accuracyMap)


def aggregateStats(service, top_k, samplesNumber, accuracyMap):
	classesNumber = len(accuracyMap)
	if samplesNumber <= 0 or classesNumber <= 0:
		print('Not stats to aggregate.')
		return
	accuracies = [0.] * top_k
	meanAccuracies = [0.] * top_k
	for key in accuracyMap:
		if accuracyMap[key][0] > 0:
			mult = 100. / accuracyMap[key][0]
		else:
			print('No sample for key:', key)
			mult = 0.
		for k in range(2, top_k+1):
			accuracyMap[key][k] += accuracyMap[key][k-1]
		for k in range(1, top_k+1):
			accuracies[k-1] += accuracyMap[key][k]
			accuracyMap[key][k] *= mult
			meanAccuracies[k-1] += accuracyMap[key][k]
	for k in range(top_k):
		accuracies[k] *= 100. / samplesNumber
		meanAccuracies[k] /= classesNumber
	saveResults(service, top_k, samplesNumber, accuracies, meanAccuracies, accuracyMap)


formatPercent = lambda x : '%5.1f %%' % x
formatPercentList = lambda percents : list(map(formatPercent, percents))

def saveResults(service, top_k, samplesNumber, accuracies, meanAccuracies, accuracyMap):
	outputFilename = 'logs/%s_top%d.txt' % (service, top_k)
	file = open(outputFilename, 'w')
	file.write('Service: %s\nNumber of symbols: %d\nAccuracies:\n\n' % (service, len(accuracyMap)))
	headers = ['Class', 'Samples'] + [ 'TOP %d' % (i+1) for i in range(top_k) ]
	table = [['MEAN (dataset)', samplesNumber] + formatPercentList(accuracies)]
	table += [['MEAN (classes)', samplesNumber] + formatPercentList(meanAccuracies)]
	for key in accuracyMap:
		table.append([key, accuracyMap[key][0]] + formatPercentList(accuracyMap[key][1:]))
	table.sort(key=lambda row : row[1], reverse=True)
	stringTable = tabulate(table, headers=headers, tablefmt="github", colalign=("left", *["right"] * (top_k+1)))
	file.write(stringTable + '\n')
	file.close()
	print('Done writing to:', outputFilename)


if __name__ == '__main__':

	# hwrt: train: 151160 samples, test: 17074 (split 90% / 10%). 369 classes.
	# This takes ~ 3m 30s to run:
	classes_hwrt, testDataset_hwrt = loadDataset('hwrt', datasetPath=testDatasetPath_hwrt)
	benchmark('hwrt', dataset=testDataset_hwrt, top_k=5)

	# # detexify: 210454 samples, 1077 classes.
	# # This takes ~ 35m to run:
	# classes_detexify, testDataset_detexify = loadDataset('detexify', datasetPath=datasetPath_detexify)
	# benchmark('detexify', dataset=testDataset_detexify[-20000:], top_k=5)



# TODO:

# Frontend:
# - frontend > datasets : symbol metadata
# - new buttons layout - https://www.w3schools.com/csS/css3_buttons.asp

# Backend:
# - support custom classes
# - recall / precision / F1 ?
# - add curl requests examples
# - verify found keys vs symbols map (inclusion needed)
# - split this files: formatter / loader / benchmark (& update formatter)
# - cleanup logs/ directory

# Benchmark issues:
# - MEAN (classes) stats probably wrong: many classes with too few samples.
# - Detexify: training supposed to be the first 20k samples, not sure about that...
# New samples need to be created to have a more robust validation.
