import sys, json
from tabulate import tabulate

# Backend code:
import server, loader, formatter, mappings


# Checks how much the given dataset cover the service supported classes, after projection:
def validateDataset(service, mapping, dataset, verbose=False):
	foundClasses = set()
	for sample in dataset:
		symbol = mappings.getProjectedSymbol(sample[0], mapping)
		foundClasses.add(symbol)
	serviceClasses = mappings.getServiceProjectedSymbolsSet(service, mapping)
	unknownClasses = foundClasses.difference(serviceClasses)
	missingClasses = serviceClasses.difference(foundClasses)
	print("* Found %d / %d classes for service '%s' and mapping '%s'" %
		(len(serviceClasses) - len(missingClasses), len(serviceClasses), service, mapping))
	print("* Found %d unsupported classes." % len(unknownClasses))
	if verbose and unknownClasses != set():
		print('', *unknownClasses, '', sep='\n')


# Benchmarks the classification capabilities of the given service:
def benchmark(service, mapping, dataset, top_k):
	validateDataset(service, mapping, dataset)
	print("\n-> Starting the benchmark of service '%s', with mapping '%s':" % (service, mapping))
	serviceClasses = mappings.getServiceProjectedSymbolsSet(service, mapping)
	recallMap = {}
	samplesNumber = len(dataset)
	for rank in range(samplesNumber):
		key, strokes = dataset[rank]
		key = mappings.getProjectedSymbol(key, mapping)
		if not key in serviceClasses:
			# print('-> Ignored class:', key)
			continue
		strokes = json.loads(strokes)
		if service == 'detexify':
			strokes = formatter.formatStrokesTo('hwrt', strokes)
		# print(key, strokes)
		result, status = server.classifyRequest(service, mapping, strokes)
		# print('result:', result)
		if status != 200:
			print('ERROR at rank:', rank)
			break
		if not key in recallMap:
			recallMap[key] = [0] * (top_k+1) # sample and top_k success number
		recallMap[key][0] += 1
		max_results = min(top_k, len(result))
		for i in range(max_results):
			if key == result[i]['symbol_class']:
				recallMap[key][i+1] += 1
				break
	aggregateStats(service, mapping, top_k, samplesNumber, recallMap)


def aggregateStats(service, mapping, top_k, samplesNumber, recallMap):
	classesNumber = len(recallMap)
	if samplesNumber <= 0 or classesNumber <= 0:
		print('Not stats to aggregate.')
		return
	microRecalls = [0.] * top_k
	macroRecalls = [0.] * top_k
	for key in recallMap:
		if recallMap[key][0] > 0:
			mult = 100. / recallMap[key][0]
		else:
			print('No sample for key:', key)
			mult = 0.
		for k in range(2, top_k+1):
			recallMap[key][k] += recallMap[key][k-1]
		for k in range(1, top_k+1):
			microRecalls[k-1] += recallMap[key][k]
			recallMap[key][k] *= mult
			macroRecalls[k-1] += recallMap[key][k]
	for k in range(top_k):
		microRecalls[k] *= 100. / samplesNumber
		macroRecalls[k] /= classesNumber
	saveResults(service, mapping, top_k, samplesNumber, microRecalls, macroRecalls, recallMap)


formatPercent = lambda x : '%5.1f %%' % x
formatPercentList = lambda percents : list(map(formatPercent, percents))

def saveResults(service, mapping, top_k, samplesNumber, microRecalls, macroRecalls, recallMap):
	headers = ['Class', 'Samples'] + [ 'TOP %d' % (i+1) for i in range(top_k) ]
	table = [['MACRO', samplesNumber] + formatPercentList(macroRecalls)]
	table.append(['MICRO', samplesNumber] + formatPercentList(microRecalls))
	for key in recallMap:
		table.append([key, recallMap[key][0]] + formatPercentList(recallMap[key][1:]))
	table.sort(key=lambda row : row[1], reverse=True) # sorting by decreasing samples number.
	stringTable = tabulate(table, headers=headers, tablefmt="github", colalign=("left", *["right"] * (top_k+1)))
	content = 'Service: %s, mapping: %s\nNumber of symbols: %d\nRecall scores:\n\n' % (service, mapping, len(recallMap))
	content += stringTable + '\n'
	outputPath = loader.statsDir / ('%s_%s_top%d.txt' % (service, mapping, top_k))
	loader.writeContent(outputPath, content)


if __name__ == '__main__':
	if len(sys.argv) < 2:
		print('''Please give as args the name of the service to benchmark, and the mapping used (optional).'''
			'''\n- Supported services: hwrt, detexify\n- Optional mappings: '''
			+ ', '.join(loader.getSupportedMappings()))
		exit()
	service = sys.argv[1]
	mapping = 'none' # default
	if len(sys.argv) >= 3:
		mapping = sys.argv[2]

	if service == 'hwrt':
		# hwrt: train: 151160 samples, test: 17074 (split 90% / 10%). 368 / 377 classes found.
		# This takes ~ 3m 30s to run:
		testDataset = loader.loadDataset(service, loader.testDatasetPath_hwrt)
		benchmark(service, mapping, dataset=testDataset, top_k=5)

	elif service == 'detexify':
		# detexify: 210454 samples, training done on first 20K, testing on last 20K. 1077 classes overall.
		# This takes ~ 35m to run:
		testDataset = loader.loadDataset(service, loader.datasetPath_detexify)
		benchmark(service, mapping, dataset=testDataset[-20000:], top_k=5)

	else:
		print('Unsupported service:', service)
		exit()
