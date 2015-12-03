#!/usr/bin/env node

var program = require('commander');
var fs = require('fs');
var package = require('./package.json');
var odesza = require('./');

program
  .version(package.version)
  .usage('<file> [options]')
  .description('Compiles odesza templates.')
  .option('-o, --output', 'output file')
  .parse(process.argv);


var template = odesza.compile(program.args[0]);

if (program.output) {
  fs.writeFileSync(program.args[1], template);
} else {
  process.stdout.write(template);
}
