import sys, json
from collections import OrderedDict
from tabulate import tabulate
from tqdm import tqdm

# Backend code:
import server, loader, formatter, mappings


# Benchmarks the classification capabilities of the given service, and save data on correlated answers:
def benchmark(service, mapping, dataset, top_k=5, samplesThreshold=10, filterAnswersData=False, suffix=''):
	metadata = datasetMining(service, mapping, dataset, suffix)
	print("\n-> Starting the benchmark of service '%s', with mapping '%s':" % (service, mapping))
	loader.getLatexToUnicodeMap() # pre-loading, for prettier console output with tqdm.
	recallMap, answersMap = ingestDataset(service, mapping, dataset, top_k, metadata)
	if aggregateStats(service, top_k, samplesThreshold, metadata, recallMap, answersMap):
		saveResults(service, mapping, top_k, samplesThreshold, metadata, recallMap, answersMap, filterAnswersData, suffix)


# Do a mining task on a given dataset. This does not require a service to be running.
# Specifically, finds and saves frequencies of each symbol in each dataset class, assuming a projection is used.
# Also, checks how much the given dataset cover the service supported classes, after projection.
# Returns metadata about found and missing classes:
def datasetMining(service, mapping, dataset, suffix, verboseLevel=1):
	# Obtaining classes from the dataset, and symbols frequency in each class:
	foundClasses, freqResult = set(), {}
	for sample in dataset:
		symbolClass = mappings.getProjectedSymbol(sample[0], mapping)
		foundClasses.add(symbolClass)
		if not symbolClass in freqResult:
			freqResult[symbolClass] = {'samples': 0, 'interClassFreq': {}}
		freqResult[symbolClass]['samples'] += 1
		if not sample[0] in freqResult[symbolClass]['interClassFreq']:
			freqResult[symbolClass]['interClassFreq'][sample[0]] = 0
		freqResult[symbolClass]['interClassFreq'][sample[0]] += 1
	for key in freqResult:
		classFrequencies = freqResult[key]['interClassFreq']
		for symbol in classFrequencies:
			classFrequencies[symbol] = round(classFrequencies[symbol] / freqResult[key]['samples'], 3) # cannot divide by 0
		itemsList = sorted(freqResult[key]['interClassFreq'].items(), key=printingOrder)
		freqResult[key]['interClassFreq'] = OrderedDict(itemsList)
	if mapping != 'none' and mapping in loader.getSupportedMappings():
		jsonString = peculiarJsonString(freqResult, keysFilteringFunction=None, keysSortingFunction=lambda key : key)
		frequenciesPath = loader.frequenciesDir / ('%s_%s%s.json' % (service, mapping, suffix)) # 'service' as dataset name here
		loader.writeContent(frequenciesPath, jsonString)

	# Comparing found classes with those supported by the service:
	serviceClassesSet = mappings.getServiceProjectedSymbolsSet(service, mapping)
	foundServiceClasses = sorted(foundClasses.intersection(serviceClassesSet))
	missingClasses = sorted(serviceClassesSet.difference(foundClasses))
	unknownClasses = sorted(foundClasses.difference(serviceClassesSet))
	print("* Found %d / %d classes for service '%s' and mapping '%s'" %
		(len(foundServiceClasses), len(serviceClassesSet), service, mapping))
	print("* Missing: %d classes." % len(missingClasses))
	if verboseLevel >= 1 and len(missingClasses) > 0:
		print('', *missingClasses, '', sep='\n')
	print("* Found %d unsupported classes." % len(unknownClasses))
	if verboseLevel >= 2 and len(unknownClasses) > 0:
		print('', *unknownClasses, '', sep='\n')
	return {
		'datasetSize': len(dataset),
		'freqResult': freqResult,
		'serviceClassesSet': serviceClassesSet,
		'foundServiceClasses': foundServiceClasses,
		'missingClasses': missingClasses
	}


# Collect stats on service answers given dataset samples. This does require a service to be running!
def ingestDataset(service, mapping, dataset, top_k, metadata):
	serviceClassesSet = metadata['serviceClassesSet']
	recallMap = { key: [0] * (top_k+1) for key in serviceClassesSet }
	answersMap = { key: { key: 0 for key in serviceClassesSet } for key in serviceClassesSet }
	answeredClassesSet = set()
	for rank in tqdm(range(len(dataset))):
		key, strokes = dataset[rank]
		key = mappings.getProjectedSymbol(key, mapping)
		if not key in serviceClassesSet:
			# print('-> Ignored class:', key)
			continue
		strokes = json.loads(strokes)
		if service == 'detexify':
			strokes = formatter.formatStrokesTo('hwrt', strokes)
		# print(key, strokes)
		answers, status = server.classifyRequest(service, mapping, strokes)
		# print('answers:', answers)
		if status != 200:
			print('Classify request failed at rank %d' % rank)
			exit()
		recallMap[key][0] += 1
		maxAnswers = min(top_k, len(answers))
		for i in range(maxAnswers):
			answer = answers[i]['symbol_class']
			if key == answer:
				recallMap[key][i+1] += 1
			answersMap[key][answer] += top_k - i # Adding weight to the ranking. This does not rely on service
			# scores which may be noisy, and would also require a unified score format across services.
		answeredClassesSet.update([ answers[i]['symbol_class'] for i in range(len(answers)) ]) # all answers used!
	unknownClasses = sorted(answeredClassesSet.difference(serviceClassesSet))
	if len(unknownClasses) > 0:
		print('\nService %s answered %d unknown classes:\n' % (service, len(unknownClasses)), *unknownClasses, '', sep='\n')
	return recallMap, answersMap


# Aggregate stats collected by ingestDataset().
# 'recallMap' values for each class: samples number and top_k success rates.
# 'answersMap' values for each class: dict containing most common answered classes
# for the correct class, sorted by likelihood.
# Note: 'samplesThreshold' is only used for computing top-k macro scores:
# classes with less samples than this threshold are ignored.
# Careful, '<Accuracy>' and '<Macro>' must not be mapping keys!
def aggregateStats(service, top_k, samplesThreshold, metadata, recallMap, answersMap):
	relevantClassesSet = set(filter(lambda key : recallMap[key][0] >= samplesThreshold, recallMap.keys()))
	relevantClassesNumber = metadata['relevantClassesNumber'] = len(relevantClassesSet)
	relevantClassesSamplesNumber = sum([recallMap[key][0] for key in relevantClassesSet])
	supportedSamplesNumber = sum([recallMap[key][0] for key in recallMap])
	print('%d samples were ignored.' % (metadata['datasetSize'] - supportedSamplesNumber))
	if supportedSamplesNumber <= 0:
		print('Not stats to aggregate.')
		return False
	recallMap['<Accuracy>'] = [supportedSamplesNumber] + [0] * top_k
	recallMap['<Macro>'] = [relevantClassesSamplesNumber] + [0] * top_k
	for key in recallMap:
		if key in ['<Accuracy>', '<Macro>']:
			continue
		mult = 1. / recallMap[key][0] if recallMap[key][0] > 0 else 0.
		for k in range(2, top_k+1):
			recallMap[key][k] += recallMap[key][k-1]
		for k in range(1, top_k+1):
			recallMap['<Accuracy>'][k] += recallMap[key][k]
			recallMap[key][k] *= mult
			if key in relevantClassesSet:
				recallMap['<Macro>'][k] += recallMap[key][k]
	for k in range(1, top_k+1):
		recallMap['<Accuracy>'][k] /= supportedSamplesNumber
		if relevantClassesNumber > 0:
			recallMap['<Macro>'][k] /= relevantClassesNumber
	for key in answersMap:
		itemsList = list(filter(lambda t : t[1] > 0, answersMap[key].items()))
		sumSamples = sum(map(lambda t : t[1], itemsList)) # is > 0 when itemsList != []
		itemsList = sorted(itemsList, key=printingOrder)[:top_k]
		itemsList = list(map(lambda t : (t[0], round(t[1] / sumSamples, 3)), itemsList))
		answersMap[key] = OrderedDict(itemsList)
	return True


def saveResults(service, mapping, top_k, samplesThreshold, metadata, recallMap, answersMap, filterAnswersData, suffix):
	# Saving stats:
	headers = ['Class', 'Samples'] + [ 'TOP %d' % (i+1) for i in range(top_k) ]
	table = [ [key, recallMap[key][0]] + formatPercentList(recallMap[key][1:]) for key in recallMap ]
	table.sort(key=printingOrder)
	stringTable = tabulate(table, headers=headers, tablefmt="github", colalign=("left", *["right"] * (top_k+1)))
	classesData = "Found %d / %d classes" % (len(metadata['foundServiceClasses']), len(metadata['serviceClassesSet']))
	content = 'Service: %s, mapping: %s\n%s\nMacro-scores: %d classes with samples number >= %d\nRecall scores:\n\n%s\n' % (
		service, mapping, classesData, metadata['relevantClassesNumber'], samplesThreshold, stringTable)
	statsPath = loader.statsDir / ('%s_%s_top%d%s.txt' % (service, mapping, top_k, suffix))
	loader.writeContent(statsPath, content)

	# Saving data on correlated answers:
	filtering = lambda key : True # no filtering
	if filterAnswersData:
		filtering = lambda key : answersMap[key] != {} and key != next(iter(answersMap[key]))
		# filtering = lambda key : not (answersMap[key] == {} or key in answersMap[key]) or answersMap[key][key] < 0.5
		# filtering = lambda key : recallMap[key][0] >= max(1, samplesThreshold) and recallMap[key][1] < 0.5
	jsonString = peculiarJsonString(answersMap, keysFilteringFunction=filtering, keysSortingFunction=lambda key : key)
	answersPath = loader.answersDir / ('%s_%s%s%s.json' % (service, mapping, '_filtered' if filterAnswersData else '', suffix))
	loader.writeContent(answersPath, jsonString)


# Get a string from a dict object, with each first order object being separated by a newline:
def peculiarJsonString(aDict, keysFilteringFunction=None, keysSortingFunction=None):
	processedKeys = aDict.keys()
	if keysFilteringFunction != None:
		processedKeys = filter(keysFilteringFunction, processedKeys)
	if keysSortingFunction != None:
		processedKeys = sorted(processedKeys, key=keysSortingFunction)
	entryList = [ json.dumps(key) + ': ' + json.dumps(aDict[key], sort_keys=False) for key in processedKeys ]
	return '{\n' + ',\n'.join(entryList) + '\n}'


printingOrder = lambda x : (-x[1], x[0]) # sorting by decreasing samples number, and by name.
formatPercent = lambda x : '%5.1f %%' % (100. * x)
formatPercentList = lambda percents : list(map(formatPercent, percents))


if __name__ == '__main__':
	supportedServices, supportedMappings = loader.getSupportedServices(), loader.getSupportedMappings()
	if len(sys.argv) < 2:
		print("Please give as args the name of the service to benchmark, and the mapping used (optional, default to 'none')."
			"\n- Supported services: %s\n- Optional mappings: %s"
			% (', '.join(supportedServices), ', '.join(supportedMappings)))
		exit()
	service = sys.argv[1]
	mapping = sys.argv[2] if len(sys.argv) >= 3 else 'none'
	if not mapping in supportedMappings:
		print("Insupported mapping '%s', not running the benchmark." % mapping)
		exit()
	if service == 'hwrt':
		# hwrt: train: 151160 samples, test: 17074 (split 90% / 10%). 368 / 378 classes found.
		# This takes ~ 3m 30s to run:
		testDataset = loader.loadDataset(service, loader.testDatasetPath_hwrt)
		benchmark(service, mapping, dataset=testDataset)
	elif service == 'detexify':
		# detexify: 210454 samples, training done on first 20K, testing on last 20K. 1077 classes overall.
		# This takes ~ 35m to run:
		testDataset = loader.loadDataset(service, loader.datasetPath_detexify)
		benchmark(service, mapping, dataset=testDataset[-20000:], suffix='_last_20K')
	else:
		print('Unsupported service:', service)
