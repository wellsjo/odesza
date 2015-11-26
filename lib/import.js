/**
 * Implements the 'import' keyword
 */

'use strict'

function importKeyword(ctx) {

  var rgx = /import\(\'([\w.]+)\'\)/g;
  var matches = ctx.template.match(rgx);

  if (matches == null) return;

  // make matches values unique
  matches = matches.filter((m, i) => matches.indexOf(m) == i);

  // replace each import match with the compiled version
  matches.forEach(match => {
    let name = match.split('\'')[1];
    ctx.template = ctx.template.split(match).join(this.compile(name));
  });
}

module.exports = importKeyword;
