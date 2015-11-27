'use strict';

const assert = require('assert');
const odesza = require('../');
const test = require('tape');
const path = require('path');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf-8');
const fixture = file => path.join(__dirname, 'fixtures', file);

test('render variable', t => {
  let vars = { value: 'world' };
  let string = odesza.render('hello ${value}', vars);
  t.ok(string == 'hello world', 'template renders')
  t.end();
});

test('compile file', t => {
  let vars = { value: 'world' };
  let string = odesza.compile(fixture('simple.txt'), vars);
  t.ok(string == 'hello world', 'template compiles');
  t.end();
});

test('import', t => {
  let vars = { name : 'yo' };
  let string = odesza.compile(fixture('message1'), vars);
  t.ok(string == 'yo1', 'import statement works');
  t.end();
});

test('recursive imports', t => {
  let vars = { name: 'yo' };
  let string = odesza.compile(fixture('message3.txt'), vars);
  t.ok(string == 'yo3yo1', 'recursive import statements');
  t.end();
});

test('multiple import statements', t => {
  let vars = { name: 'yo' };
  let string = odesza.compile(fixture('messages.txt'), vars);
  t.ok(string == 'yo1yo2yo3yo1', 'multiple import statements');
  t.end();
});
