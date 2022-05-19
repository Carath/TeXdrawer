import json

# Backend code:
import loader, formatter


# This is agnostic of any service.
# 'classes' contains the equivalence classes of the given mapping;
# 'projection' contains the dictionary mapping each symbol to its equivalence class.
class Mapping:
	def __init__(self, name, classes, projection):
		self.name = name # str
		self.classes = classes # dict
		self.projection = projection # dict


_mappingsLoader = { 'none': Mapping('none', {}, {}) } # default mapping

def getMapping(mappingName):
	try:
		if mappingName in _mappingsLoader:
			return _mappingsLoader[mappingName]
		path = loader.mappingsDir / ('%s.json' % mappingName)
		equivClasses = getEquivalenceClasses(path)
		projectionMap = buildProjectionMap(equivClasses, mappingName)
		_mappingsLoader[mappingName] = Mapping(mappingName, equivClasses, projectionMap)
		print('Loaded mapping:', mappingName)
	except:
		print("Mapping '%s' not found, falling back to default." % mappingName)
		_mappingsLoader[mappingName] = getMapping('none') # mappingName forced to default
	return _mappingsLoader[mappingName]


def getEquivalenceClasses(mappingPath):
	return json.loads(loader.getFileContent(mappingPath))


def buildProjectionMap(equivClasses, mappingName):
	projectionMap = {}
	for key in equivClasses:
		for symbol in equivClasses[key]:
			assert not symbol in projectionMap, \
				"Projection error in mapping '%s': symbol '%s' already found." % (mappingName, symbol)
			# assert will be catched by the exception mechanism.
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


# Returns the set of all classes whose projection is supported
# by the projected service for at least one of the given mappings:
def getSymbolCandidatesSet(service, mappingNamesList):
	symbolCandidatesSet = set()
	for m in mappingNamesList:
		mapp = getMapping(m)
		projClassesSet = getServiceProjectedSymbolsSet(service, m)
		symbolCandidatesSet.update(projClassesSet - set(mapp.projection.keys()))
		for key in mapp.classes:
			if key in projClassesSet:
				symbolCandidatesSet.update(mapp.classes[key])
	return symbolCandidatesSet


# Creating a new mapping by composing two given mappings
# mapping1 and mapping2 into mapping1 o mapping2:
def mappingsComposition(mapping1, mapping2, newMappingName):
	if newMappingName in loader.getSupportedMappings():
		print("Mapping '%s' already exists." % newMappingName)
		return None
	projectedKeysValues, equivClasses = [], {}
	for val in mapping2.projection:
		projKey = getProjectedSymbol(mapping2.projection[val], mapping1.name)
		projectedKeysValues.append((projKey, val))
	for val in mapping1.projection:
		if val not in mapping2.projection:
			projKey = mapping1.projection[val]
			projectedKeysValues.append((projKey, val))
	for pair in projectedKeysValues:
		if pair[0] not in equivClasses:
			equivClasses[pair[0]] = set()
		equivClasses[pair[0]].add(pair[1])
	equivClasses = [ (c[0], sorted(c[1])) for c in equivClasses.items() ]
	equivClasses = dict(sorted(equivClasses, key=lambda c : c[0]))
	projectionMap = buildProjectionMap(equivClasses, newMappingName)
	return Mapping(newMappingName, equivClasses, projectionMap)


def areMappingEquivalent(mapping1, mapping2):
	# Discarding symbols sent to themselves, since they can be omitted:
	pairs1 = set([ c for c in mapping1.projection.items() if c[0] != c[1] ])
	pairs2 = set([ c for c in mapping2.projection.items() if c[0] != c[1] ])
	return pairs1 == pairs2


def saveMapping(mapping, newMappingName):
	if newMappingName in loader.getSupportedMappings():
		print("Mapping '%s' already exists." % newMappingName)
		return
	jsonString = formatter.peculiarJsonString(equivClasses)
	path = loader.mappingsDir / ('%s.json' % newMappingName)
	loader.writeContent(path, jsonString)


mappingOrderKey = lambda mappingName : len(getMapping(mappingName).projection.keys())


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
