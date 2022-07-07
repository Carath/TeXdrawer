import sys, json, traceback, math
from collections import OrderedDict
from tabulate import tabulate
from tqdm import tqdm

# Backend code:
import server, loader, formatter, mappings


printingOrderKey = lambda x : (-x[1], x[0]) # sorting by decreasing samples number, and by name.
formatPercent = lambda x : '%5.1f %%' % (100. * x)


# Benchmarking the classification capabilities of the given service, and saving data on correlated answers.
# - mappingsList: list of mappings to be used in the benchmark. By default, all are used.
# - top_k: stats will be generated for up to the top_k-th prediction of the service for a given sample.
# - samplesThreshold: used for computing top-k macro scores, classes with less samples than this threshold will be ignored.
# - filterAnswersData: weither answered classes should be filtered when generating correlated answers data.
# - suffix: will be added to the generated files name.
def benchmark(service, dataset, mappingsList=[], top_k=5, samplesThreshold=50,
	saving=True, saveUnrecognizedSamples=False, filterAnswersData=False, suffix=''):
	try:
		supportedMappings = loader.getSupportedMappings()
		if len(mappingsList) == 0:
			mappingsList = supportedMappings
		else:
			mappingsList = [ m for m in mappingsList if m in supportedMappings ] + ['none'] # always benchmarking 'none'.
		mappingsList = sorted(set(mappingsList), key=mappings.mappingOrderKey)
		print("\n-> Starting the benchmark of service '%s', with mappings %s:\n" % (service, mappingsList))
		stats = {
			'service': service,
			'top_k': top_k,
			'samplesThreshold': samplesThreshold,
			'datasetSize': len(dataset),
			'strokesRange': [],
			'mappings': { m : {} for m in mappingsList }
		}
		loader.getLatexToUnicodeMap() # pre-loading, for prettier console output with tqdm.
		datasetMining(stats, dataset)
		ingestDataset(stats, dataset)
		aggregateStats(stats)
		generateStatsRecap(stats)
		if saving:
			saveResults(stats, saveUnrecognizedSamples, filterAnswersData, suffix)
		print('\nStats recap:\n', json.dumps(stats['recap']))
		return stats['recap']
	except:
		print('\nBenchmark failed with error:\n\n' + traceback.format_exc())
		return {}


# Does a mining task on a given dataset. This does not require a service to be running.
# Specifically, finds and saves frequencies of each source symbol in each projected class,
# and checks how much the given dataset covers the service supported classes, after projection.
def datasetMining(stats, dataset, verboseLevel=1):
	service, samplesThreshold, mStats = stats['service'], stats['samplesThreshold'], stats['mappings']
	for m in mStats:
		projClassesSet = mappings.getServiceProjectedSymbolsSet(service, m)
		frequencies = { key : {'samples': 0, 'interClassFreq': {}} for key in projClassesSet }

		# Obtaining classes from the dataset, and symbols frequency in each class.
		# N.B: an unsupported symbol whose projection is supported by the service must be listed in 'interClassFreq'.
		foundClassesSet = set()
		for sample in dataset:
			symbolClass = mappings.getProjectedSymbol(sample[0], m)
			foundClassesSet.add(symbolClass)
			if symbolClass in projClassesSet: # i.e projection is supported.
				frequencies[symbolClass]['samples'] += 1
				classFrequencies = frequencies[symbolClass]['interClassFreq']
				if sample[0] not in classFrequencies:
					classFrequencies[sample[0]] = 0
				classFrequencies[sample[0]] += 1
		for key in frequencies:
			classFrequencies = frequencies[key]['interClassFreq']
			for symbol in classFrequencies:
				classFrequencies[symbol] = round(classFrequencies[symbol] / frequencies[key]['samples'], 3) # cannot divide by 0
			itemsList = sorted(classFrequencies.items(), key=printingOrderKey)
			frequencies[key]['interClassFreq'] = OrderedDict(itemsList)

		# Comparing found classes with those supported by the service:
		foundProjClasses = sorted(foundClassesSet & projClassesSet)
		missingProjClasses = sorted(projClassesSet - foundClassesSet)
		unknownProjClasses = sorted(foundClassesSet - projClassesSet)
		relevantProjClassesSet = set([ key for key in frequencies if frequencies[key]['samples'] >= samplesThreshold ])
		print('\n' + '-' * 50 + '\n* Mapping:', m)
		print("* Found %d / %d classes for service '%s' and mapping '%s'" %
			(len(foundProjClasses), len(projClassesSet), service, m))
		print("* Missing: %d classes." % len(missingProjClasses))
		if verboseLevel >= 1 and len(missingProjClasses) > 0:
			print('', *missingProjClasses, '', sep='\n')
		print("* Found %d unsupported classes." % len(unknownProjClasses))
		if verboseLevel >= 2 and len(unknownProjClasses) > 0:
			print('', *unknownProjClasses, '', sep='\n')
		mStats[m].update({
			'projClassesSet': projClassesSet,
			'foundProjClasses': foundProjClasses,
			'relevantProjClassesSet': relevantProjClassesSet,
			'missingProjClasses': missingProjClasses,
			'unknownProjClasses': unknownProjClasses,
			'frequencies': frequencies
		})


# Collects stats on service answers given dataset samples. This does require a service to be running!
def ingestDataset(stats, dataset):
	service, top_k, mStats = stats['service'], stats['top_k'], stats['mappings']
	symbolCandidatesSet = mappings.getSymbolCandidatesSet(service, mStats.keys())
	print('\nFound %d symbol candidates for mappings: %s\n' % (len(symbolCandidatesSet), list(mStats.keys())))
	for m in mStats:
		projClassesSet = mStats[m]['projClassesSet']
		mStats[m]['answers'] = { key : { key2 : 0 for key2 in projClassesSet } for key in projClassesSet }
		mStats[m]['recalls'] = { key : [0] * (top_k+1) for key in projClassesSet } # class samples number and top_k counts
		mStats[m]['unrecognized'] = {}
		mStats[m]['answeredProjClassesSet'] = set()
	strokesFormat = 'hwrt'
	xmin, xmax, ymin, ymax = math.inf, -math.inf, math.inf, -math.inf
	for rank in tqdm(range(len(dataset))):
		vanillaKey, strokes = dataset[rank]
		if vanillaKey not in symbolCandidatesSet:
			# print('-> Ignored vanilla class:', vanillaKey)
			continue # discarding classes whose projection isn't supported with any mapping.
		if type(strokes) == str:
			strokes = json.loads(strokes) # strokes full loading: str -> dict
		if service == 'detexify':
			strokes = formatter.formatStrokesTo(strokesFormat, strokes)
		# print(vanillaKey, strokes)
		_xmin, _xmax, _ymin, _ymax = formatter.getStrokesStats(strokesFormat, strokes)
		xmin, xmax, ymin, ymax = min(xmin, _xmin), max(xmax, _xmax), min(ymin, _ymin), max(ymax, _ymax)
		vanillaAnswers, status = server.classifyRequest(service, 'none', strokes) # requests without mapping!
		# print('vanillaAnswers:', vanillaAnswers)
		if status != 200:
			print("=> Classify request failed at rank %d, make sure the '%s' service is running.\n" % (rank, service))
			exit() # will be catched by the exception mechanism.

		# Projecting the vanilla answers with each mapping:
		for m in mStats:
			# Saving all answered classes with mapping m, as a consistency check:
			answers = formatter.aggregateAnswers(service, m, vanillaAnswers)
			mStats[m]['answeredProjClassesSet'].update([ answer['symbol_class'] for answer in answers ])
			# Saving stats for supported classes:
			key = mappings.getProjectedSymbol(vanillaKey, m)
			if key not in mStats[m]['projClassesSet']:
				# print('-> Ignored class:', key)
				continue # discarding classes whose projection isn't supported with m.
			mStats[m]['recalls'][key][0] += 1 # first value: class samples number.
			maxAnswers = min(top_k, len(answers))
			isKeyAnswered = False
			for i in range(maxAnswers):
				answer = answers[i]['symbol_class']
				if key == answer:
					isKeyAnswered = True
					mStats[m]['recalls'][key][i+1] += 1 # top_k counts
				mStats[m]['answers'][key][answer] += top_k - i # Adding >= 0 weights to the answers ranking.
				# This does not rely on service scores which may be noisy, and would also require a unified
				# score format across services.
			if not isKeyAnswered:
				formatter.reshiftTime(strokesFormat, strokes)
				mStats[m]['unrecognized'][rank] = [key, strokes]

	stats['strokesRange'] = [xmin, xmax, ymin, ymax]
	print('\nStrokes coordinates range (among supported symbols):', stats['strokesRange'], '\n')
	for m in mStats:
		invalidProjClasses = sorted(mStats[m]['answeredProjClassesSet'] - mStats[m]['projClassesSet'])
		mStats[m]['invalidProjClasses'] = invalidProjClasses
		if len(invalidProjClasses) > 0: # service symbols list has issues...
			print('\nService %s answered %d unknown classes for mapping %s:\n' % (
				service, len(invalidProjClasses), m), *invalidProjClasses, '', sep='\n')


# Aggregates stats collected by ingestDataset().
# - 'recallMap' values for each class: samples number and top_k success rates.
# - 'answersMap' values for each class: dict containing most common answered source classes
#   for the correct class, sorted by likelihood.
# Careful, '<Accuracy>' and '<Macro>' are reserved keys!
def aggregateStats(stats):
	top_k, mStats = stats['top_k'], stats['mappings']
	for m in mStats:
		relevantProjClassesSet = mStats[m]['relevantProjClassesSet']
		recallMap, answersMap = mStats[m]['recalls'], mStats[m]['answers']
		relevantSamplesNumber = sum([recallMap[key][0] for key in relevantProjClassesSet])
		projSamplesNumber = sum([recallMap[key][0] for key in recallMap])
		print('%d samples were ignored.' % (stats['datasetSize'] - projSamplesNumber))
		if projSamplesNumber <= 0:
			print('Not stats to aggregate.')
			exit() # will be catched by the exception mechanism.
		recallMap['<Accuracy>'] = [projSamplesNumber] + [0] * top_k
		recallMap['<Macro>'] = [relevantSamplesNumber] + [0] * top_k
		for key in recallMap:
			if key in ['<Accuracy>', '<Macro>']: # reserved keys.
				continue
			mult = 1. / recallMap[key][0] if recallMap[key][0] > 0 else 0.
			for k in range(2, top_k+1):
				recallMap[key][k] += recallMap[key][k-1]
			for k in range(1, top_k+1):
				recallMap['<Accuracy>'][k] += recallMap[key][k]
				recallMap[key][k] *= mult
				if key in relevantProjClassesSet:
					recallMap['<Macro>'][k] += recallMap[key][k]
		for k in range(1, top_k+1):
			recallMap['<Accuracy>'][k] /= projSamplesNumber
			if len(relevantProjClassesSet) > 0:
				recallMap['<Macro>'][k] /= len(relevantProjClassesSet)
		for key in answersMap:
			sumSamples = sum(answersMap[key].values()) # values are >= 0.
			itemsList = [ item for item in answersMap[key].items() if item[1] > 0 ]
			itemsList = sorted(itemsList, key=printingOrderKey)[:top_k]
			itemsList = [ (item[0], round(item[1] / sumSamples, 3)) for item in itemsList ] # cannot divide by 0.
			answersMap[key] = OrderedDict(itemsList)


# Adding stats recap to be used in the MLOps phase:
def generateStatsRecap(stats):
	mStats = stats['mappings']
	stats['recap'] = {
		'service': stats['service'],
		'top_k': stats['top_k'],
		'samples_threshold': stats['samplesThreshold'],
		'mappings': {
			m: {
				'classes_number': len(mStats[m]['projClassesSet']),
				'missing_classes_number': len(mStats[m]['missingProjClasses']),
				'relevant_classes_number': len(mStats[m]['relevantProjClassesSet']),
				# 'projected_classes': sorted(mStats[m]['projClassesSet']),
				'accuracy': {
					'samples': mStats[m]['recalls']['<Accuracy>'][0],
					'scores': [ round(x, 8) for x in mStats[m]['recalls']['<Accuracy>'][1:] ]
				},
				'macro_recall': {
					'samples': mStats[m]['recalls']['<Macro>'][0],
					'scores': [ round(x, 8) for x in mStats[m]['recalls']['<Macro>'][1:] ]
				}
			} for m in mStats
		}
	}


# Saving the benchmark results in separate files:
def saveResults(stats, saveUnrecognizedSamples, filterAnswersData, suffix):
	service, top_k, samplesThreshold, mStats = stats['service'], stats['top_k'], stats['samplesThreshold'], stats['mappings']
	for m in mStats:
		recallMap, answersMap = mStats[m]['recalls'], mStats[m]['answers']

		# Saving recall scores:
		headers = ['Class', 'Samples'] + [ 'TOP %d' % (i+1) for i in range(top_k) ]
		table = [ [key, recallMap[key][0]] + [ formatPercent(x) for x in recallMap[key][1:] ] for key in recallMap ]
		table.sort(key=printingOrderKey)
		stringTable = tabulate(table, headers=headers, tablefmt="github", colalign=("left", *["right"] * (top_k+1)))
		classesData = "Found %d / %d classes" % (len(mStats[m]['foundProjClasses']), len(mStats[m]['projClassesSet']))
		content = 'Service: %s, mapping: %s\n%s\nMacro score: %d classes with samples number >= %d\nRecall scores:\n\n%s\n' % (
			service, m, classesData, len(mStats[m]['relevantProjClassesSet']), samplesThreshold, stringTable)
		statsPath = loader.statsDir / ('%s_%s_top%d%s.txt' % (service, m, top_k, suffix))
		loader.writeContent(statsPath, content)

		# Saving data on correlated answers:
		filtering = None # no filtering
		if filterAnswersData:
			filtering = lambda key : answersMap[key] != {} and key != next(iter(answersMap[key]))
			# filtering = lambda key : not (answersMap[key] == {} or key in answersMap[key]) or answersMap[key][key] < 0.5
			# filtering = lambda key : recallMap[key][0] >= max(1, samplesThreshold) and recallMap[key][1] < 0.5
		jsonString = formatter.peculiarJsonString(answersMap, keysFilteringFunction=filtering, keysSortingFunction='key')
		answersPath = loader.answersDir / ('%s_%s%s%s.json' % (service, m, '_filtered' if filterAnswersData else '', suffix))
		loader.writeContent(answersPath, jsonString)

		# Saving inter-class frequencies:
		jsonString = formatter.peculiarJsonString(mStats[m]['frequencies'], keysSortingFunction='key')
		frequenciesPath = loader.frequenciesDir / ('%s_%s%s.json' % (service, m, suffix)) # 'service' as dataset name here
		loader.writeContent(frequenciesPath, jsonString)

		# Saving totally unrecognized samples by the service:
		if saveUnrecognizedSamples:
			jsonString = formatter.peculiarJsonString(mStats[m]['unrecognized'], compact=True)
			unrecognizedPath = loader.unrecognizedDir / ('%s_%s%s.json' % (service, m, suffix))
			loader.writeContent(unrecognizedPath, jsonString)

	# Saving stats recap:
	jsonString = json.dumps(stats['recap'], indent='  ')
	recapPath = loader.recapDir / ('%s%s.json' % (service, suffix))
	loader.writeContent(recapPath, jsonString)


if __name__ == '__main__':
	if len(sys.argv) < 2:
		print("Please give as arg the name of the service to benchmark on all available mappings.\n"
			"Optionally, the benchmark may only use some selected mappings which must be given as further args."
			"\n- Supported services: %s\n- Available mappings: %s"
			% (', '.join(loader.getSupportedServices()), ', '.join(loader.getSupportedMappings())))
		exit()
	service = sys.argv[1]
	mappingsList = sys.argv[2:]
	if service == 'hwrt':
		# hwrt: train: 151160 samples, test: 17074 (split 90% / 10%). 368 / 378 classes found.
		# This takes ~ 3m 30s to run:
		testDataset = loader.loadDataset(service, loader.testDatasetPath_hwrt)
		benchmark(service, testDataset, mappingsList=mappingsList, saveUnrecognizedSamples=True)
	elif service == 'detexify':
		# detexify: 210454 samples, training done on first 20K, testing on last 20K. 1077 classes overall.
		# This takes ~ 35m to run:
		testDataset = loader.loadDataset(service, loader.datasetPath_detexify)
		benchmark(service, testDataset[-20000:], mappingsList=mappingsList, suffix='_last_20K')
	else:
		print('Unsupported service:', service)
