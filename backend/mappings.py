import json

# Backend code:
import loader

mappingsLoader = {}


# This is agnostic of any service.
# 'classes' contains the equivalence classes of the given mapping;
# 'projection' contains the dictionary mapping each symbol to its equivalence class.
class Mapping:
	def __init__(self, name, classes, projection):
		self.name = name
		self.classes = classes
		self.projection = projection


def getMapping(mappingName):
	try:
		if mappingName in mappingsLoader:
			return mappingsLoader[mappingName]
		mappingPath = '../symbols/mappings/%s.json' % mappingName
		print('Loading:', mappingPath)
		equivClasses = getEquivalenceClasses(mappingPath)
		projectionMap = buildProjectionMap(equivClasses)
		mappingsLoader[mappingName] = Mapping(mappingName, equivClasses, projectionMap)
	except:
		print("Mapping '%s' not found, falling back to default." % mappingName)
		mappingsLoader[mappingName] = getMapping('none') # default
	finally:
		return mappingsLoader[mappingName]


def getEquivalenceClasses(mappingPath):
	return json.loads(loader.getFileContent(mappingPath))


def buildProjectionMap(equivClasses):
	projectionMap = {}
	for item in equivClasses.items():
		key, values = item
		for symbol in values:
			assert not symbol in projectionMap, \
				'Projection error: symbol %s already found.' % symbol
			projectionMap[symbol] = key
	return projectionMap


# Symbols present in the projection map may not be supported for a given
# service, and the usage of such a projection must be optional...
# ... which it is, just pass a {} projection map.
def getProjectedSymbolsSet(symbols, projectionMap):
	projectedSymbols = set()
	for symbol in symbols:
		if symbol in projectionMap:
			symbol = projectionMap[symbol]
		projectedSymbols.add(symbol)
	return projectedSymbols


def getProjectedSymbol(symbol, mappingName):
	projectionMap = getMapping(mappingName).projection
	return list(getProjectedSymbolsSet([symbol], projectionMap))[0]


def getServiceProjectedSymbolsSet(service, projectionMap):
	return getProjectedSymbolsSet(loader.getSymbolsSet(service), projectionMap)


def getServiceProjectedSymbolsSorted(service, projectionMap):
	return sorted(getServiceProjectedSymbolsSet(service, projectionMap))


if __name__ == '__main__':

	# mappingName = 'none' # default
	mappingName = 'map1'
	mapping = getMapping(mappingName)
	print("\n'%s' equivalence classes:\n" % mappingName, *mapping.classes.items(), sep='\n')
	print("\nFound %d equivalence classes." % len(mapping.classes))
	print("\n'%s' projection map:\n" % mappingName, *mapping.projection.items(), sep='\n')

	service = 'hwrt'
	# service = 'detexify'
	symbols = loader.getSymbolsSet(service)
	projectedSymbols = getServiceProjectedSymbolsSorted(service, mapping.projection)
	print("\n'%s' projected symbols:\n" % service, *projectedSymbols, sep='\n')
	print("\n'%s' projected symbols number: %d (vs %d)" % (service, len(projectedSymbols), len(symbols)))
