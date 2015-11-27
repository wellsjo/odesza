'use strict';

const assert = require('assert');
const odesza = require('../');
const test = require('tape');
const path = require('path');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf-8');
const fixture = file => path.join(__dirname, 'fixtures', file);

test('simple', t => {
  let vars = { value: 'world' };
  let string = odesza.compile(fixture('simple.txt'), vars);
  t.ok(string == 'hello world', 'template compiles');
  t.end();
});

test('import', t => {
  let vars = { name : 'me' };
  let string = odesza.compile(fixture('messages.txt'), vars);
  console.log(string);
});
