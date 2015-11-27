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
 * @param {object} vars An object of key-value pairs representing the
 * variables to be used in the template.
 * @return {string} The rendered template.
 */

odesza.render = function(template, vars) {

  vars = vars && 'object' == typeof vars ? vars : {};

  template = resolveImports(template);

  try {
    return vm.runInNewContext('`' + template + '`', vars);
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
  try {
    var template = fs.readFileSync(path).toString().trim();
  } catch (e) {
    throw new Error(e);
  }
  return odesza.render(template, options);
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

/**
 * Adds support for import keyword.
 */

function resolveImports(template) {

  // matches import('file'), import("file")
  var rgx = /(import|require)\([\'\"]([\w.]+)[\'\"]\)/g;

  // make matches values unique
  var matches = template.match(rgx) || [];
  matches = matches.filter((m, i) => matches.indexOf(m) == i);

  // replace each import match with the compiled version
  matches.forEach(match => {
    let name = match.split('\'')[1];
    template = template.split(match).join(odesza.compile(name));
  });

  return template;
}
