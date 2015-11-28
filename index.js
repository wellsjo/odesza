/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <wells@littlstar.com>
 */

'use strict'

var fs = require('fs');
var vm = require('vm');
var odesza = {};
var blockContent = {};

/**
 * Renders a template with the given variables.
 *
 * @param {string} template The template to render.
 * @param {object} options An object of key-value pairs representing the
 * variables to be used in the template.
 * @param {string} [basePath] Optional. The base path to use for import and
 * require statements.
 * @return {string} The rendered template.
 */

odesza.render = function(template, options, basePath) {

  options = options && 'object' == typeof options ? options : {};

  var s = statements(template);

  s.blocks.forEach(block => {
    if (s.blocks.indexOf(`end${block}`) > -1) {
      let start = template.indexOf(block) + block.length;
      let end = template.indexOf(`end${block}`);
      blockContent[block] = template.substr(start, end - start).trim();
    } else {
      // check if the block is available in memory
      if (blockContent[block] != null) {
        template = template.split(block).join(blockContent[block]);
        delete blockContent[block];
      } else {
        // if not in memory, it is a block statement that can be ignored
        template = template.split(block).join('');
      }
    }
  });

  // if an extend statement is found, fill the extended template blocks in
  if (s.extend.length) {
    if (s.extend.length > 1) {
      throw new Error('An odesza template can only extend one file');
    }
    let path = `${basePath}${s.extend[0].split('\'')[1]}`;
    let extendedTemplate = odesza.compile(path, options);
    console.log(extendedTemplate);
  }

  // recursively replace each import statement with its compiled template
  s.imports.forEach(statement => {
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

// matches extend, include, import statements
const rgx = /(extend|block|endblock|include|require)\([\'\"]([\w.\/]+)[\'\"]\)/g;

// extracts statements from template
const statements = template => {
  var m = template.match(rgx) || []; // keyword matches
  var statements = {};
  statements.extend = m.filter(s => s.indexOf('extend') == 0);
  statements.blocks = m.filter(s => s.indexOf('block') == 0 || s.indexOf('endblock') == 0);
  statements.imports = m.filter(s => s.indexOf('import') == 0 || s.indexOf('include') == 0);
  statements.requires = m.filter(s => s.indexOf('require') == 0);
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
