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

// matches keyword statements (block, include, extends)
const findStatements = /(block|extends|include) ([\/\.\w]+)/g;

// hold block statements in memory
const blocks = {};

// used to cache templates and paths (minimize fs calls)
const cache = {
  templates: {},
  paths: {}
};

// cache control
var useCache = true;

// export odesza
const odesza = {};
module.exports = odesza;


/**
 * Renders a template with the given variables.
 *
 * @param {String} template The template to render.
 * @param {Object} options An object of key-value pairs representing the
 * variables to be used in the template.
 * @param {String} [basePath] Optional. The base path to use if extend or
 * include statements are present.
 * @return {String} The rendered template.
 */

odesza.render = function(template, options, basePath) {

  options = options && 'object' == typeof options ? options : {};

  template = stripComments(template);

  let statements = getStatements(template);

  // if an extend statement is found, fill the extended template blocks in
  if (statements.extends.length) {

    // only allow a template to extend one file
    if (statements.extends.length > 1) {
      throw new Error('An odesza template can only extend one file at a time');
    }

    // loop over block statements, putting them into memory
    statements.block.forEach(block => {

      // if the block is in memory, this means there is multiple inheritence,
      // i.e. this has already extended
      if (blocks[block] != null) return;

      // gets the content between the block statements
      let start = template.indexOf(`block ${block}`) + `block ${block}`.length;
      let end = template.indexOf(`endblock`, start);

      if (end == -1) {
        throw new Error(`'endblock' statement required after ${block}`);
      }

      // store the block section in memory to fill in the extended template
      blocks[block] = template.substr(start, end - start).trim();
    });

    let extendPath = `${basePath}${statements.extends[0]}`;
    template = odesza.renderFile(extendPath, options);

    // now get the statements for the extended template
    statements = getStatements(template);

  } else {

    // this is the base template (no extends found), so we fill in the blocks
    statements.block.forEach(block => {

      if (blocks[block] != null) {
        template = template.split(`block ${block}`).join(blocks[block]);
        delete blocks[block];
      } else {

        // if there is a block statement in the base file but no block in
        // memory, it can be ignored
        template = template.split(`block ${block}`).join('');
      }
    });
  }

  // recursively replace each import statement with its rendered template
  statements.include.forEach(statement => {
    let file = `${basePath}${statement}`;
    template = template
      .split(`include ${statement}`)
      .join(odesza.renderFile(file, options));
  });

  return vm
    .runInNewContext('`' + template + '`', options)
    .replace('#{', '${')
    .trim();
};

/**
 * Renders a template file.
 *
 * @param {String} location The location to the template file.
 * @param {Object} options Options passed in to render the template.
 * @return {String} The rendered template.
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
};

/**
 * Returns an object of keyword statements for a given template string.
 *
 * @private
 * @param {String} template The template string to find keywords in.
 * @return {Object} An object ontaining extends, block, and include statements
 * found in the template string.
 */

function getStatements(template) {
  var statements = {
    extends: [],
    block: [],
    include: []
  };

  var match;
  while ((match = findStatements.exec(template)) != null) {
    statements[match[1]].push(match[2]);
  }

  // sorting the block and include statements by length eliminates a bug where
  // blocks that are substrings of each other get confused.
  const byLength = (a, b) => {
    if (a.lenght > b.length) return -1;
    if (b.length > a.length) return 1;
    return 0;
  };

  statements.block.sort(byLength);
  statements.include.sort(byLength);

  return statements;
}

/**
 * Resolves the template file path, throwing an error if anything is wrong.  By
 * default, the path lookups are all cached.
 *
 * @private
 * @param {String} file The relative file to the file.
 * @return {String} The resolved path for the file.
 */

function resolvePath(file) {

  if (typeof file != 'string') {
    throw new TypeError('invalid file: input must be a string');
  }

  if (useCache && cache.paths[file] != null) {
    return cache.paths[file];
  }

  let resolvedPath = path.resolve(file);

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
