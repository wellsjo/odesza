'use strict';

const assert = require('assert');
const odesza = require('../');
const test = require('tape');
const path = require('path');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf-8');
const fixture = file => path.join(__dirname, 'fixtures', file);

test('simple', t => {
  let context = odesza({value: 'world'});
  let string = context.compile(fixture('simple.txt'));
  t.ok(string == 'hello world', 'template compiles');
  t.end();
});

test('simple middleware', t => {
  let context = odesza({value: 'odesza'});
  let ware = ctx => { ctx.template = ctx.template.replace('hello', 'HELLO') };
  let string = context.use(ware).compile(fixture('simple.txt'));
  t.ok(string == 'HELLO odesza', 'template compiles with middleware changes');
  t.end();
});

test('function middleware', t => {
  let context = odesza();
  let injectHello = ctx => { ctx.context.hello = () => 'hello'; };
  let string = context.use(injectHello).compile(fixture('with-function-call.txt'));
  t.ok(string == 'hello', 'template compiles with middleware function call');
  t.end();
});
