'use strict'

var fs = require('fs');
var vm = require('vm');

var odesza = {};

odesza.render = (path, vars) => {
  try {
    let t = fs.readFileSync(path).toString();
    return vm.runInNewContext('`' + t + '`', vars);
  } catch (e) {
    throw new Error(e);
  }
};

odesza.__express = (path, options, fn) => {
  return fn(this.render());
};

module.exports = odesza;
