'use strict'

module.exports = Lexer;

const flagMap = [
  ["global", "g"],
  ["ignoreCase", "i"],
  ["multiline", "m"],
  ["sticky", "y"]
];

// Lexer
function Lexer() {
  this.setIndex = false;
  this.useNew = false;
  for (let i = 0; i < arguments.length; ++i) {
    let arg = arguments[i];
    if (arg === Lexer.USE_NEW) {
      this.useNew = true;
    } else if (arg === Lexer.SET_INDEX) {
      this.setIndex = Lexer.DEFAULT_INDEX;
    } else if (arg instanceof Lexer.SET_INDEX) {
      this.setIndex = arg.indexProp;
    }
  }
  this.rules = [];
  this.errorLexeme = null;
}

Lexer.NULL_LEXEME = {};

Lexer.ERROR_LEXEME = {
  toString: function() {
    return "[object Lexer.ERROR_LEXEME]";
  }
};

Lexer.DEFAULT_INDEX = "index";

Lexer.USE_NEW = {};

Lexer.SET_INDEX = function(indexProp) {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee.apply(this, arguments);
  }
  if (indexProp === undefined) {
    indexProp = Lexer.DEFAULT_INDEX;
  }
  this.indexProp = indexProp;
};

Lexer.prototype = {
  constructor: Lexer,
  addRule: function(regex, lexeme) {
    let rule = new Rule(regex, lexeme);
    this.rules.push(rule);
  },
  setErrorLexeme: function(lexeme) {
    this.errorLexeme = lexeme;
  },
  runLexeme: function(lexeme, exec) {
    if (typeof lexeme !== "function") {
      return lexeme;
    }
    let args = exec.concat(exec.index, exec.input);
    if (this.useNew) {
      return New.apply(lexeme, args);
    }
    return lexeme.apply(null, args);
  },
  lex: function(str) {
    let index = 0;
    let lexemes = [];
    if (this.setIndex) {
      lexemes.push = function() {
        for (let i = 0; i < arguments.length; ++i) {
          if (arguments[i]) {
            arguments[i][this.setIndex] = index;
          }
        }
        return Array.prototype.push.apply(this, arguments);
      };
    }
    while (index < str.length) {
      let bestExec = null;
      let bestRule = null;
      for (let i = 0; i < this.rules.length; ++i) {
        let rule = this.rules[i];
        rule.regex.lastIndex = index;
        let exec = rule.regex.exec(str);
        if (exec) {
          let doUpdate = !bestExec || (exec.index < bestExec.index) || (exec.index === bestExec.index && exec[0].length > bestExec[0].length);
          if (doUpdate) {
            bestExec = exec;
            bestRule = rule;
          }
        }
      }
      if (!bestExec) {
        if (this.errorLexeme) {
          lexemes.push(this.errorLexeme);
          return lexemes.filter(not(Lexer.NULL_LEXEME));
        }
        ++index;
      } else {
        if (this.errorLexeme && index !== bestExec.index) {
          lexemes.push(this.errorLexeme);
        }
        let lexeme = this.runLexeme(bestRule.lexeme, bestExec);
        lexemes.push(lexeme);
        index = bestRule.regex.lastIndex;
      }
    }
    return lexemes.filter(not(Lexer.NULL_LEXEME));
  }
};

function Rule(regex, lexeme) {
  if (!regex.global) {
    let flags = "g" + getFlags(regex);
    regex = new RegExp(regex.source, flags);
  }
  this.regex = regex;
  this.lexeme = lexeme;
}

function getFlags(regex) {
  let flags = "";
  for (let i = 0; i < flagMap.length; ++i) {
    if (regex[flagMap[i][0]]) {
      flags += flagMap[i][1];
    }
  }
  return flags;
}

function not(x) {
  return function(y) {
    return x !== y;
  };
}
