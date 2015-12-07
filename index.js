/**
 * Flexible template engine powered by ES6 template strings.
 *
 * @author Wells Johnston <wells@littlstar.com>
 */

'use strict'

var fs = require('fs');
var vm = require('vm');
var p = require('path');

var odesza = {};
var blocks = {};

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

  try {
    return vm.runInNewContext('`' + template + '`', options).trim();
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Renders a template file.
 *
 * @param {string} path The path to the template file.
 * @param {object} options Options passed in to render the template.
 * @return {string} The rendered template.
 */

odesza.renderFile = function(path, options) {
  path = resolvePath(path);
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
    return fn(null, odesza.renderFile(path, options));
  } catch (e) {
    return fn(e);
  }
};

// matches keyword statements
const re = /(block|extends|include) ([\/\.\w]+)/g;

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

// resolves the template file path, throwing an error if anything is wrong
function resolvePath(path) {
  if (typeof path != 'string') {
    throw new TypeError('path must be a string');
  }
  path = p.resolve(path);
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
}

module.exports = odesza;
