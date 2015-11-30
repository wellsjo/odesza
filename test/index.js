'use strict';

const odesza = require('../');
const test = require('tape');
const path = require('path');
const fs = require('fs');
const fixture = file => path.join(__dirname, 'fixtures', file);

test('render variable', t => {
  let vars = { value: 'world' };
  let string = odesza.render('hello ${value}', vars);
  t.ok(string == 'hello world', 'template strings render')
  t.end();
});

test('compile file', t => {
  let vars = { value: 'world' };
  let string = odesza.compile(fixture('simple'), vars);
  t.ok(string == 'hello world', 'template files compile');
  t.end();
});

test('file with variables', t => {
  let vars = { name : 'world' };
  let string = odesza.compile(fixture('messages/message1'), vars);
  t.ok(string == 'hello world 1!', 'variables work');
  t.end();
});

test('include single file', t => {
  let vars = { name: 'world' };
  let string = odesza.compile(fixture('messages/message3'), vars);
  t.ok(string == 'hello world 1!', 'single file was included');
  t.end();
});

test('multiple recursive include statements', t => {
  let vars = { name: 'world' };
  let string = odesza.compile(fixture('includes'), vars);
  let answer = fs.readFileSync(fixture('answers/answer1')).toString().trim();
  t.ok(string == answer, 'multiple files were included recursively');
  t.end();
});

test('extend with block statement', t => {
  let vars = {
    title: 'hello world',
    name: 'world',
    basePath: '/public/js/'
  };
  let template = odesza.compile(fixture('content.odesza'), vars);
  var answer = fs.readFileSync(fixture('answers/complex_answer1')).toString().trim();
  t.ok(template == answer, 'extended template with block statement');
  t.end();
});

test('multiple inheritence by chaining extends', t => {
  let vars = {
    title: 'hello world',
    name: 'world',
    basePath: '/public/js/'
  };
  let template = odesza.compile(fixture('extend_content.odesza'), vars);
  var answer = fs.readFileSync(fixture('answers/complex_answer2')).toString().trim();
  t.ok(template == answer, 'multiple inheritence with extends');
  t.end();
});

test('extending and including from parent directories', t => {
  let vars = {
    title: 'hello',
    name: 'world',
    basePath: 'public/js/'
  };
  let template = odesza.compile(fixture('messages/dir/dir/message5'), vars);
  let answer = fs.readFileSync(fixture('answers/complex_answer5')).toString().trim();
  t.ok(template == answer, 'files can be extended and included from parent directories');
  t.end();
});

test('list content using native array methods', t => {
  let names = ['wells', 'joe', 'dom'];
  let vars = {
    title: 'world',
    names: names,
    basePath: 'public/js/'
  };
  let template = odesza.compile(fixture('simple_js'), vars);
  var answer = fs.readFileSync(fixture('answers/complex_answer3')).toString().trim();
  t.ok(template == answer, 'simple js functions (map) work inline');
  t.end();
});

test('complex inline js', t => {
  let names = ['wells', 'joe', 'dom'];
  let vars = {
    names: names
  };
  let template = odesza.compile(fixture('inline_js'), vars);
  let answer = fs.readFileSync(fixture('answers/complex_answer4')).toString().trim();
  t.ok(template == answer, 'complex inline js works');
  t.end();
});
