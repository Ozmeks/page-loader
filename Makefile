install:
	npm ci
	npm link
lint:
	npx eslint .
test:
	npm test
test-coverage:
	npm test -- --coverage --coverageProvider=v8
debug:
	DEBUG=page-loader* make test
debug-nock:
	DEBUG=nock.* make test
debug-axios:
	DEBUG=axios make test