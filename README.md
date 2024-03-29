### Tests and linter status:
[![Linter and tests](https://github.com/Ozmeks/backend-project-lvl3/actions/workflows/node-check.yml/badge.svg)](https://github.com/Ozmeks/backend-project-lvl3/actions/workflows/node-check.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/c20ce0b3299232e264b6/maintainability)](https://codeclimate.com/github/Ozmeks/backend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c20ce0b3299232e264b6/test_coverage)](https://codeclimate.com/github/Ozmeks/backend-project-lvl3/test_coverage)

# Annotation
CLI application that downloads HTML pages with local sources from the Internet.

### How to install:
```sh
$ make install
```

### How to use:
You can use the utility as a console application or as a as a library in your JavaScript project.

In terminal:

```
$ pageloader -h
Usage: pageloader [options] <url>

CLI application that downloads pages from the Internet.

Options:
  -V, --version       output the version number
  -o, --output [dir]  output dir (default: "/home/user/current-dir")
  -h, --help          display help for command
```

In project:

```
import pageLoader from 'pageloader';
pageLoader(url, filePath);
```

#### Page loading example:
[![asciicast](https://asciinema.org/a/547016.svg)](https://asciinema.org/a/547016)

#### Debug mode example:
[![asciicast](https://asciinema.org/a/547115.svg)](https://asciinema.org/a/547115)