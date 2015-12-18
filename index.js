/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <w@wellsjohnston.com>
 */

'use strict'

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const stripComments = require('strip-comments');

const odesza = {};
const blocks = {};

const cache = {
  templates: {},
  paths: {}
};

// matches keyword statements (block, include, extends)
const findStatements = /(block|extends|include) ([\/\.\w]+)/g;

module.exports = odesza;

// cache control
var useCache = true;

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

  template = stripComments(template);

  let s = getStatements(template);

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
    let p = `${basePath}${statement}`;
    template = template
      .split(`include ${statement}`)
      .join(odesza.renderFile(p, options));
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
  var template;
  let basePath = location.substr(0, location.lastIndexOf('/') + 1);
  location = resolvePath(location);
  if (useCache && cache.templates[location] != null) {
    template = cache.templates[location];
  } else {
    template = fs.readFileSync(location).toString().trim();
    cache.templates[location] = template;
  }
  return odesza.render(template, options, basePath);
};

/**
 * Disables template and path caching (all fs lookups).
 *
 * @public
 */

odesza.disableCache = function() {
  useCache = false;
};

/**
 * Adds support for Express framework.
 *
 * @public
 * @param {string} file
 * @param {object} options
 * @param {function} fn
 */

odesza.__express = function(file, options, fn) {
  try {
    return fn(null, odesza.renderFile(file, options));
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
  while ((m = findStatements.exec(template)) != null) {
    s[m[1]].push(m[2]);
  }
  s.block.sort((a, b) => {
    if (a.length > b.length) {
      return -1;
    } else if (a.length < b.length) {
      return 1;
    }
    return 0;
  });
  return s;
}

/**
 * Resolves the template file path, throwing an error if anything is wrong.  By
 * default, the path lookups are all cached.
 *
 * @private
 * @param {string} file The relative file to the file.
 * @return {string} The resolved path for the file.
 */

function resolvePath(file) {
  if (typeof file != 'string') {
    throw new TypeError('invalid file: input must be a string');
  }
  if (useCache && cache.paths[file] != null) {
    return cache.paths[file];
  }
  var resolvedPath = path.resolve(file);
  if (!fs.existsSync(resolvedPath)) {
    if (fs.existsSync(`${resolvedPath}.ode`)) {
      resolvedPath += '.ode';
    } else if (fs.existsSync(`${resolvedPath}.odesza`)) {
      resolvedPath += '.odesza';
    } else {
      throw new Error(`cannot find file with file: ${file}`);
    }
  }
  cache.paths[file] = resolvedPath;
  return resolvedPath;
}
