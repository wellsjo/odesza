/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <wells@littlstar.com>
 */

'use strict'

var fs = require('fs');
var vm = require('vm');

var odesza = {};
var blocks = {};
var keywords = ['extends', 'block', 'include'];

/**
 * Renders a template with the given variables.
 *
 * @param {string} template The template to render.
 * @param {object} options An object of key-value pairs representing the
 * variables to be used in the template.
 * @param {string} [basePath] Optional. The base path to use if extend or
 * include statements are present.
 * @return {string} The rendered template.
 */

odesza.render = function(template, options, basePath) {

  options = options && 'object' == typeof options ? options : {};

  var s = statements(template);

  // if an extend statement is found, fill the extended template blocks in
  if (s.extend.length) {

    // only allow one extend statement
    if (s.extend.length > 1) {
      throw new Error('An odesza template can only extend one file');
    }

    // loop over block statements, putting them into memory
    s.blocks.forEach(block => {

      // if the block is in memory, this means there is multiple inheritence,
      // i.e. this has already extended
      if (blocks[block] != null) return;

      let start = template.indexOf(block) + block.length;
      let end = template.indexOf(block.replace('block', 'end'));
      if (end == -1) {
        throw new Error(`end statement required after ${block}`);
      }
      blocks[block] = template.substr(start, end - start).trim();
    });

    let path = `${basePath}${s.extend[0].split('\'')[1]}`;
    template = odesza.compile(path, options);
    s = statements(template);

  } else {
    s.blocks.forEach(block => {
      if (blocks[block] != null) {
        template = template.split(block).join(blocks[block]);
        delete blocks[block];
      } else {
        // if not in memory, it is a block statement that can be ignored
        template = template.split(block).join('');
      }
    });
  }

  // recursively replace each import statement with its compiled template
  s.includes.forEach(statement => {
    let path = `${basePath}${statement.split('\'')[1]}`;
    template = template.split(statement).join(odesza.compile(path, options));
  });

  try {
    return vm.runInNewContext('`' + template + '`', options);
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Compiles a template file.
 *
 * @param {string} path The path to the template file.
 * @param {object} options Options passed in to render the template.
 * @return {string} The rendered template.
 */

odesza.compile = function(path, options) {
  path = resolve(path);
  try {
    var basePath = path.substr(0, path.lastIndexOf('/') + 1);
    var template = fs.readFileSync(path).toString().trim();
  } catch (e) {
    throw new Error(e);
  }
  return odesza.render(template, options, basePath);
};

/**
 * Adds support for express.
 *
 * @param {string} path
 * @param {object} options
 * @param {function} fn
 */

odesza.__express = function(path, options, fn) {
  try {
    return fn(null, odesza.compile(path, options));
  } catch (e) {
    return fn(e);
  }
};

// matches keyword statements
const rstr = `(${keywords.join('|')})\\([\\\'\\\"]([\\w.\\/]+)[\\\'\\\"]\\)`;
const keyWordsRegex = new RegExp(rstr, 'g');

// extracts statements from template
const statements = template => {
  var statements = {};
  var m = template.match(keyWordsRegex) || [];
  statements.extend = m.filter(s => s.indexOf('extend') == 0);
  statements.blocks = m.filter(s => s.indexOf('block') == 0);
  statements.includes = m.filter(s => s.indexOf('include') == 0);
  return statements;
};

// resolves the template file path, throwing an error if anything is wrong
const resolve = path => {
  if (typeof path != 'string') {
    throw new TypeError('path must be a string');
  }
  if (!fs.existsSync(path)) {
    if (fs.existsSync(`${path}.ode`)) {
      path += '.ode';
    } else if (fs.existsSync(`${path}.odesza`)) {
      path += '.odesza';
    } else {
      throw new Error(`cannot find file with path: ${path}`);
    }
  }
  return path;
};

module.exports = odesza;
