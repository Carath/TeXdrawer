import json

# Backend code:
import loader


# This is agnostic of any service.
# 'classes' contains the equivalence classes of the given mapping;
# 'projection' contains the dictionary mapping each symbol to its equivalence class.
class Mapping:
	def __init__(self, name, classes, projection):
		self.name = name
		self.classes = classes # dict
		self.projection = projection # dict


_mappingsLoader = {'none': Mapping('none', {}, {})} # default mapping

def getMapping(mappingName):
	try:
		if mappingName in _mappingsLoader:
			return _mappingsLoader[mappingName]
		path = loader.mappingsDir / ('%s.json' % mappingName)
		equivClasses = getEquivalenceClasses(path)
		print('Loaded mapping:', mappingName)
		projectionMap = buildProjectionMap(equivClasses)
		_mappingsLoader[mappingName] = Mapping(mappingName, equivClasses, projectionMap)
	except:
		print("Mapping '%s' not found, falling back to default." % mappingName)
		_mappingsLoader[mappingName] = getMapping('none') # mappingName forced to default
	return _mappingsLoader[mappingName]


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


# Symbols present in the projection map may not be supported by the given service,
# and reciprocally symbols from the service may not figure in the projection.
# In that case, such symbols are kept as is. The usage of a projection is optional,
# by passing the 'none' mapping name.
def getProjectedSymbolsSet(symbols, mappingName):
	projectionMap = getMapping(mappingName).projection
	projectedSymbols = set()
	for symbol in symbols:
		if symbol in projectionMap:
			symbol = projectionMap[symbol]
		projectedSymbols.add(symbol)
	return projectedSymbols


def getProjectedSymbol(symbol, mappingName):
	return list(getProjectedSymbolsSet([symbol], mappingName))[0]


def getServiceProjectedSymbolsSet(service, mappingName):
	return getProjectedSymbolsSet(loader.getSymbolsSet(service), mappingName)


def getServiceProjectedSymbolsSorted(service, mappingName):
	return sorted(getServiceProjectedSymbolsSet(service, mappingName))


if __name__ == '__main__':

	# mappingName = 'none' # default
	# mappingName = 'strict-0'
	mappingName = 'similar-0'
	mapping = getMapping(mappingName)
	print("\n'%s' equivalence classes:\n" % mappingName, *mapping.classes.items(), sep='\n')
	print("\nFound %d equivalence classes." % len(mapping.classes))
	print("\n'%s' projection map:\n" % mappingName, *mapping.projection.items(), sep='\n')

	service = 'hwrt'
	# service = 'detexify'
	symbols = loader.getSymbolsSet(service)
	projectedSymbols = getServiceProjectedSymbolsSorted(service, mappingName)
	print("\n'%s' projected symbols:\n" % service, *projectedSymbols, sep='\n')
	print("\n'%s' projected symbols number: %d (vs %d)" % (service, len(projectedSymbols), len(symbols)))
