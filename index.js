/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <w@wellsjohnston.com>
 */

'use strict'

const Template = require('./lib/template');
var useCache = true;

const odesza = {};
module.exports = odesza;

/**
 * Creates and returns a new template given `vars` and `basePath`.
 *
 * @param {String} str The template string to render.
 * @param {Object} vars An object of key-value pairs representing the
 * variables to be used in the template.
 * @param {String} [basePath] Optional. The base path to use if extend or
 * include statements are present.
 * @return {String} The rendered template.
 */

odesza.render = function(str, vars, basePath) {

  basePath = basePath || process.cwd();

  let template = new Template(useCache);
  let templateString = template.render(str, vars, basePath);

  template.escapes.forEach(block => {
    templateString = templateString.replace(block.key, block.text);
  });

  return templateString;
}


/**
 * Creates and returns a rendered template from a file location.
 *
 * @param {String} location The location to the template file.
 * @param {Object} vars variables passed in to render the template.
 * @return {String} The rendered template.
 */

odesza.renderFile = function(location, vars) {

  let template = new Template(useCache);
  let templateString = template.renderFile(location, vars);

  template.escapes.forEach(block => {
    templateString = templateString.replace(block.key, block.text);
  });

  return templateString;
}

/**
 * Adds support for Express framework.
 *
 * @public
 * @param {String} file
 * @param {Object} options
 * @param {Function} fn
 */

odesza.__express = function(file, options, fn) {
  try {
    return fn(null, odesza.renderFile(file, options));
  } catch (e) {
    return fn(e);
  }
}

odesza.enableCache = function() {
  useCache = true;
}

/**
 * Disables template and path caching (all fs lookups).
 *
 * @public
 */

odesza.disableCache = function() {
  useCache = false;
}
