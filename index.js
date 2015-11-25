/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <wells@littlstar.com>
 */

'use strict'

var extend = require('extend');
var fs = require('fs');
var vm = require('vm');

/**
 * Creates an odesza object.
 *
 * @param {Object} context Initial context
 * @return {Object}
 */

module.exports = function createOdesza (context) {

  // create scope for this instance
  var scope = extend(true, {}, context || {});

  /**
   * odesza object.
   */

  var odesza = {};

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
    var renderScope = extend(true, scope, vars);
    try {
      return vm.runInNewContext('`' + template + '`', renderScope);
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
   * odesza instance.
   */

  return odesza;
};

