
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]

# entoj image renderer

## Running tests

Runs all test specs at once
```
npm test
```

Runs all test matching the given regex
```
npm test -- --grep model/
```

Enables logging while running tests
```
npm test -- --vvvv
```

Runs all test specs and shows test coverage
```
npm run coverage
```

Lints all source files
```
npm run lint
```

# Configuration

## Global configuration

jspm.configPath: ${entoj}/jspm_packages
jspm.packagesPath: ${entoj}
jspm.configFile: jspm.js
jspm.cachePath: ${cache}/jspm


## Environment configuration

js.precompile: false
js.optimize: false
js.minimize: false
js.sourceMaps: false


---

### Licence
[Apache License 2.0](LICENCE)

[travis-image]: https://img.shields.io/travis/entoj/entoj-image/master.svg?label=linux
[travis-url]: https://travis-ci.org/entoj/entoj-image
[appveyor-image]: https://img.shields.io/appveyor/ci/ChristianAuth/entoj-image/master.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/ChristianAuth/entoj-image
[coveralls-image]: https://img.shields.io/coveralls/entoj/entoj-image/master.svg
[coveralls-url]: https://coveralls.io/r/entoj/entoj-image?branch=master
