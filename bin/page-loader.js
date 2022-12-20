#!/usr/bin/env node
import { Command } from 'commander';
import downloadPage from '../src/index.js';

const program = new Command();
program
  .description('CLI application that downloads pages from the Internet.')
  .version('1.0')
  .option('-o, --output [dir]', 'output dir (default: "current-dir")', 'default')
  .helpOption('-h, --help', 'display help for command')
  .arguments('<url>')
  .action((url) => {
    const { output } = program.opts();
    downloadPage(url, output)
      .then((output) => console.log(`Page was successfully downloaded into '${output}'`))
      .catch((e) => {
        console.error(e.message);
        process.exit(1);
      });
  })
  .parse(process.argv);
