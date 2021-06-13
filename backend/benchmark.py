import json
from tabulate import tabulate

# Backend code:
import server, loader


# Benchmarks the classification capabilities of the given service:
def benchmark(service, dataset, top_k):
	print('Starting the benchmark...')
	recallMap = {}
	samplesNumber = len(dataset)
	for rank in range(samplesNumber):
		key, strokes = dataset[rank]
		strokes = json.loads(strokes)
		if service == 'detexify':
			strokes = loader.format_detexify_datasetStrokes(strokes)
		# print(key, strokes)
		result, status = server.classifyRequest(service, strokes)
		# print('result:', result)
		if status != 200:
			print('ERROR at rank:', rank)
			break
		if not key in recallMap:
			recallMap[key] = [0] * (top_k+1) # sample and top_k success number
		recallMap[key][0] += 1
		max_results = min(top_k, len(result))
		for i in range(max_results):
			if key == result[i]['latex_command']:
				recallMap[key][i+1] += 1
				break
	aggregateStats(service, top_k, samplesNumber, recallMap)


def aggregateStats(service, top_k, samplesNumber, recallMap):
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
	saveResults(service, top_k, samplesNumber, microRecalls, macroRecalls, recallMap)


formatPercent = lambda x : '%5.1f %%' % x
formatPercentList = lambda percents : list(map(formatPercent, percents))

def saveResults(service, top_k, samplesNumber, microRecalls, macroRecalls, recallMap):
	headers = ['Class', 'Samples'] + [ 'TOP %d' % (i+1) for i in range(top_k) ]
	table = [['MICRO', samplesNumber] + formatPercentList(microRecalls)]
	table.append(['MACRO', samplesNumber] + formatPercentList(macroRecalls))
	for key in recallMap:
		table.append([key, recallMap[key][0]] + formatPercentList(recallMap[key][1:]))
	table.sort(key=lambda row : row[1], reverse=True)
	stringTable = tabulate(table, headers=headers, tablefmt="github", colalign=("left", *["right"] * (top_k+1)))
	outputFilename = 'logs/%s_top%d.txt' % (service, top_k)
	content = 'Service: %s\nNumber of symbols: %d\nRecall scores:\n\n' % (service, len(recallMap))
	content += stringTable + '\n'
	loader.writeContent(outputFilename, content)


if __name__ == '__main__':

	# hwrt: train: 151160 samples, test: 17074 (split 90% / 10%). 369 classes.
	# This takes ~ 3m 30s to run:
	foundClasses_hwrt, testDataset_hwrt = loader.loadDataset('hwrt', loader.testDatasetPath_hwrt)
	benchmark('hwrt', dataset=testDataset_hwrt, top_k=5)

	# # detexify: 210454 samples, training done on first 20K, testing on last 20K. 1077 classes overall.
	# # This takes ~ 35m to run:
	# foundClasses_detexify, testDataset_detexify = loader.loadDataset('detexify', loader.datasetPath_detexify)
	# benchmark('detexify', dataset=testDataset_detexify[-20000:], top_k=5)
