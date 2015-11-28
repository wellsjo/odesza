'use strict';

const assert = require('assert');
const odesza = require('../');
const test = require('tape');
const path = require('path');
const fs = require('fs');
const fixture = file => path.join(__dirname, 'fixtures', file);

test('render variable', t => {
  let vars = { value: 'world' };
  let string = odesza.render('hello ${value}', vars);
  t.ok(string == 'hello world', 'template renders')
  t.end();
});

test('compile file', t => {
  let vars = { value: 'world' };
  let string = odesza.compile(fixture('simple'), vars);
  t.ok(string == 'hello world', 'template compiles');
  t.end();
});

test('import', t => {
  let vars = { name : 'yo' };
  let string = odesza.compile(fixture('messages/message1'), vars);
  t.ok(string == 'yo1', 'import statement works');
  t.end();
});

test('recursive imports', t => {
  let vars = { name: 'yo' };
  let string = odesza.compile(fixture('messages/message3'), vars);
  t.ok(string == 'yo3yo1', 'recursive import statements');
  t.end();
});

test('multiple import statements', t => {
  let vars = { name: 'yo' };
  let string = odesza.compile(fixture('includes'), vars);
  t.ok(string == 'yo1yo2yo3yo1', 'multiple import statements');
  t.end();
});

test('extend complex', t => {
  let vars = {
    title: 'hello world',
    name: 'world',
    basePath: '/public/js/'
  };
  let string = odesza.compile(fixture('extend.odesza'), vars);

  console.log(string);

  let correctStr = '<!doctypehtml><html><head><title>helloworld</title></head><body>Genericbodyincludedeverywhere</body><scriptsrc="/public/js/somejavascript.js"></script><scriptsrc="/public/js/someotherjs.js"></script>analyticslol</html>';
  t.ok(string == correctStr, 'block statement');
  t.end();
});
