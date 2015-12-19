#!/usr/bin/env node

'use strict'

const fs = require('fs');
const program = require('commander');
const odesza = require('./');
const app = require('./package.json');

program
  .version(app.version)
  .usage('<file> [options] var1=val var2=val2]')
  .description('Compiles odesza templates.')
  .option('-o, --output', 'output file')
  .parse(process.argv);

const file = program.args.shift();
if (program.output) {
  const output = program.args.shift();
}

const vars = {};

program.args.forEach(arg => {
  let parts = arg.split('=');
  vars[parts[0]] = parts[1];
});

const template = odesza.renderFile(file, vars);

if (program.output) {
  fs.writeFileSync(program.args[1], template);
} else {
  process.stdout.write(template);
}
