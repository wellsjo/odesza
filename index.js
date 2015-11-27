/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <wells@littlstar.com>
 */

'use strict'

var fs = require('fs');
var vm = require('vm');

/**
 * Creates an odesza object.
 *
 * @param {Object} context Initial context
 * @return {Object}
 */

var odesza = {};
module.exports = odesza;

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

  // matches import(''), import(""), require(''), require("")
  var rgx = /(import|require)\([\'\"]([\w.\/]+)[\'\"]\)/g;
  var matches = template.match(rgx) || [];

  // make matches array values unique
  var imports = matches.filter((m, i) => matches.indexOf(m) == i);

  // recursively replace each import statement with its compiled template
  imports.forEach(statement => {
    let path = basePath + statement.split('\'')[1];
    template = template
      .split(statement)
      .join(odesza.compile(path, options));
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
  if (typeof path != 'string') {
    throw new TypeError('path must be a string');
  }
  if (path.indexOf('.') == -1) {
    path += '.odesza';
  }
  try {
    var basePath = path.substr(0, path.lastIndexOf('/') + 1);
    var template = fs.readFileSync(path).toString().trim();
  } catch (e) {
    throw new Error(e);
  }
  return odesza.render(template, options, basePath);
};

/**
 * Install plugin.
 *
 * @param {Function} fn Middlware
 * @return {Object} odesza
 */

odesza.use = function(fn) {
  if ('function' == typeof fn) {
    odesza.middleware.push(fn);
  } else {
    throw new TypeError('Middleware must provide a function.')
  }
  return this;
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
