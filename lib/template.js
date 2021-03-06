'use strict'

const vm = require('vm');
const fs = require('fs');
const btoa = require('btoa');
const path = require('path');

const findStatements = /(block|extends|include) ([\/\.\w]+)/g;

const cache = {
  templates: {},
  paths: {}
};

/**
 * Template
 *
 * Maintains state for individual templates.
 *
 * @class
 */

class Template {

  /**
   * constructor
   *
   * @param {Boolean} useCache whether to use the cache
   */

  constructor(useCache) {
    this.blocks = {};
    this.escapes = [];
    this.useCache = useCache;
  }

  /**
   * Renders a template with the given variables.
   *
   * @param {String} template The template to render.
   * @param {Object} vars An object of key-value pairs representing the
   * variables to be used in the template.
   * @param {String} [basePath] Optional. The base path to use if extend or
   * include statements are present.
   * @return {String} The rendered template.
   */

  render(template, vars, basePath) {

    vars = vars && 'object' == typeof vars ? vars : {};

    template = this.filterEscapes(template);

    let statements = this.getStatements(template);

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
        if (this.blocks[block] != null) {
          return;
        }

        // gets the content between the block statements
        let start = template.indexOf(`block ${block}`) + `block ${block}`.length;
        let end = template.indexOf(`endblock`, start);

        if (end == -1) {
          throw new Error(`'endblock' statement required after ${block}`);
        }

        // store the block section in memory to fill in the extended template
        this.blocks[block] = template.substr(start, end - start).trim();
      });

      let extendPath = `${basePath}${statements.extends[0]}`;
      template = this.renderFile(extendPath, vars);

      // now get the statements for the extended template
      statements = this.getStatements(template);
    } else {

      // this is the base template (no extends found), so we fill in the blocks
      statements.block.forEach(block => {

        if (this.blocks[block] != null) {
          template = template.split(`block ${block}`).join(this.blocks[block]);
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
      .join(this.renderFile(file, vars));
    });

    var err;
    try {
      template = vm.runInNewContext('`' + template + '`', vars);
    } catch (e) {
      return e;
    }

    return template.trim();
  }

  /**
   * Renders a template file from the location.
   *
   * @param {String} location The location to the template file.
   * @param {Object} vars variables passed in to render the template.
   * @return {String} The rendered template.
   */

  renderFile(location, vars) {

    let template = null;
    let basePath = location.substr(0, location.lastIndexOf('/') + 1);
    location = this.resolvePath(location);

    if (this.useCache && cache.templates[location] != null) {
      template = cache.templates[location];
    } else {
      template = fs.readFileSync(location).toString().trim();
      cache.templates[location] = template;
    }

    return this.render(template, vars, basePath);
  }

  /**
   * Returns an object of keyword statements for a given template string.
   *
   * @private
   * @param {String} template The template string to find keywords in.
   * @return {Object} An object ontaining extends, block, and include statements
   * found in the template string.
   */

  getStatements(template) {
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
   * Filters escape sequences out and replaces them with base64 encoded blobs.
   * The blobs are replaced at compile time.
   *
   * @private
   * @param {String} template The template string to find escape sequences for.
   * @return {String} the filtered template.
   */

  filterEscapes(template) {

    let self = this;

    // find matches in template (recursively) and keep track of escape
    // sequences in a class object
    (function findMatchesRecursive(start) {

      start = start || 0;

      let begin = template.indexOf('#{', start);
      let end = template.indexOf('}', begin);

      if (begin == -1 || end == -1) {
        return;
      }

      let text = template.substr(begin + 2, end - begin - 2);
      let key = btoa(text);

      template = template.replace(`#{${text}}`, key);

      self.escapes.push({
        text: text,
        key: key
      });

      findMatchesRecursive(end);
    })();

    return template;
  }

  /**
   * Resolves the template file path, throwing an error if anything is wrong.  By
   * default, the path lookups are all cached.
   *
   * @private
   * @param {String} location The relative location to the template file.
   * @return {String} The resolved path for the file.
   */

  resolvePath(location) {

    if (typeof location != 'string') {
      throw new TypeError('invalid file: input must be a string');
    }

    if (this.useCache && cache.paths[location] != null) {
      return cache.paths[location];
    }

    let resolvedPath = path.resolve(location);

    if (!fs.existsSync(resolvedPath)) {
      if (fs.existsSync(`${resolvedPath}.ode`)) {
        resolvedPath += '.ode';
      } else if (fs.existsSync(`${resolvedPath}.odesza`)) {
        resolvedPath += '.odesza';
      } else {
        throw new Error(`cannot find file with file: ${location}`);
      }
    }

    cache.paths[location] = resolvedPath;

    return resolvedPath;
  }
}

module.exports = Template;
