/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <w@wellsjohnston.com>
 */

'use strict'

const fs = require('fs');
const vm = require('vm');
const p = require('path');

const odesza = {};
const blocks = {};
const cache = {
  templates: {},
  paths: {}
};

// cache control
var useCache = true;

// matches keyword statements (block, include, extends)
const re = /(block|extends|include) ([\/\.\w]+)/g;

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

  // strip comments
  template = template.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');

  var s = getStatements(template);

  // if an extend statement is found, fill the extended template blocks in
  if (s.extends.length) {

    // only allow one extend statement
    if (s.extends.length > 1) {
      throw new Error('An odesza template can only extend one file');
    }

    // loop over block statements, putting them into memory
    s.block.forEach(block => {

      // if the block is in memory, this means there is multiple inheritence,
      // i.e. this has already extended
      if (blocks[block] != null) return;

      // gets the content between the block statements
      let start = template.indexOf(`block ${block}`) + `block ${block}`.length;
      let end = template.indexOf(`endblock`, start);

      if (end == -1) {
        throw new Error(`'endblock' statement required after ${block}`);
      }

      blocks[block] = template.substr(start, end - start).trim();
    });

    let extendPath = `${basePath}${s.extends[0]}`;
    template = odesza.renderFile(extendPath, options);
    s = getStatements(template);

  } else {
    s.block.forEach(block => {
      if (blocks[block] != null) {
        template = template.split(`block ${block}`).join(blocks[block]);
        delete blocks[block];
      } else {
        // if not in memory, it is a block statement that can be ignored
        template = template.split(`block ${block}`).join('');
      }
    });
  }

  // recursively replace each import statement with its rendered template
  s.include.forEach(statement => {
    let path = `${basePath}${statement}`;
    template = template
      .split(`include ${statement}`)
      .join(odesza.renderFile(path, options));
  });

  return vm.runInNewContext('`' + template + '`', options).trim();
};

/**
 * Renders a template file.
 *
 * @param {string} location The location to the template file.
 * @param {object} options Options passed in to render the template.
 * @return {string} The rendered template.
 */

odesza.renderFile = function(location, options) {
  location = resolvePath(location);
  var basePath = location.substr(0, location.lastIndexOf('/') + 1);
  var template;
  if (useCache && cache.templates[location] != null) {
    template = cache.templates[location];
  } else {
    template = fs.readFileSync(location).toString().trim();
    cache.templates[location] = template;
  }
  return odesza.render(template, options, basePath);
};

/**
 * Disables template and path caching.
 *
 * @public
 */

odesza.disableCache = function() {
  useCache = false;
};

/**
 * Adds support for express.
 *
 * @public
 * @param {string} path
 * @param {object} options
 * @param {function} fn
 */

odesza.__express = function(path, options, fn) {
  try {
    return fn(null, odesza.renderFile(path, options));
  } catch (e) {
    return fn(e);
  }
};

/**
 * Returns an object of keyword statements for a given template string.
 *
 * @private
 * @param {string} template The template string to find keywords in.
 * @return {object} An object ontaining extends, block, and include statements
 * found in the template string.
 */

function getStatements(template) {
  var s = {
    extends: [],
    block: [],
    include: []
  };
  var m;
  while ((m = re.exec(template)) != null) {
    s[m[1]].push(m[2]);
  }
  return s;
}

/**
 * Resolves the template file path, throwing an error if anything is wrong
 *
 * @private
 * @param {string} path The relative path to the file.
 * @return {string} The resolved path.
 */

function resolvePath(path) {
  if (typeof path != 'string') {
    throw new TypeError('invalid path: input must be a string');
  }
  if (useCache && cache.paths[path] != null) {
    return cache.paths[path];
  }
  var resolvedPath = p.resolve(path);
  if (!fs.existsSync(resolvedPath)) {
    if (fs.existsSync(`${resolvedPath}.ode`)) {
      resolvedPath += '.ode';
    } else if (fs.existsSync(`${resolvedPath}.odesza`)) {
      resolvedPath += '.odesza';
    } else {
      throw new Error(`cannot find file with path: ${path}`);
    }
  }
  cache.paths[path] = resolvedPath;
  return resolvedPath;
}

module.exports = odesza;
