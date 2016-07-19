/**
 * this is some of the ugliest code I've ever seen. I'm going to slowly try to
 * fix it.
 */

const Lexer = require('./lexer');

module.exports = stripComments;

const flagMap = [
  ["global", "g"],
  ["ignoreCase", "i"],
  ["multiline", "m"],
  ["sticky", "y"]
];

function stripComments(toBeStrippedStr) {

  (function() {
    let New = (function() {
      let fs = [];
      return function() {
        let f = fs[arguments.length];
        if (f) {
          return f.apply(this, arguments);
        }
        let argStrs = [];
        for (let i = 0; i < arguments.length; ++i) {
          argStrs.push("a[" + i + "]");
        }
        f = new Function("let a=arguments;return new this(" + argStrs.join() + ");");
        if (arguments.length < 100) {
          fs[arguments.length] = f;
        }
        return f.apply(this, arguments);
      };
    })();
  })();

  RegExp.concat = function() {
    let regexes = Array.prototype.slice.call(arguments);
    let regexStr = "";
    let flags = getFlags(regexes[0]) || "";
    let flagMerger = RegExp.concat.INTERSECT_FLAGS;
    if (typeof last(regexes) === "function") {
      flagMerger = regexes.pop();
    }
    for (let j = 0; j < regexes.length; ++j) {
      let regex = regexes[j];
      if (typeof regex === "string") {
        flags = flagMerger(flags, "");
        regexStr += regex;
      } else {
        flags = flagMerger(flags, getFlags(regex));
        regexStr += regex.source;
      }
    }
    return new RegExp(regexStr, flags);
  };

  (function() {
    RegExp.concat.UNION_FLAGS = function(flags1, flags2) {
      return setToString(union(toSet(flags1), toSet(flags2)));
    }
    RegExp.concat.INTERSECT_FLAGS = function(flags1, flags2) {
      return setToString(intersect(toSet(flags1), toSet(flags2)));
    };
  })();

  RegExp.prototype.group = function() {
    return RegExp.concat("(?:", this, ")", RegExp.concat.UNION_FLAGS);
  };

  RegExp.prototype.optional = function() {
    return RegExp.concat(this.group(), "?", RegExp.concat.UNION_FLAGS);
  };

  RegExp.prototype.or = function(regex) {
    return RegExp.concat(this, "|", regex, RegExp.concat.UNION_FLAGS).group();
  };

  RegExp.prototype.many = function() {
    return RegExp.concat(this.group(), "*", RegExp.concat.UNION_FLAGS);
  };

  RegExp.prototype.many1 = function() {
    return RegExp.concat(this.group(), "+", RegExp.concat.UNION_FLAGS);
  };

  let eof = /(?![\S\s])/m;
  let newline = /\r?\n/m;
  let spaces = /[\t ]*/m;
  let leadingSpaces = RegExp.concat(/^/m, spaces);
  let trailingSpaces = RegExp.concat(spaces, /$/m);

  let lineComment = /\/\/(?!@).*/m;
  let blockComment = /\/\*(?!@)(?:[^*]|\*[^/])*\*\//m;
  let comment = lineComment.or(blockComment);
  let comments = RegExp.concat(comment, RegExp.concat(spaces, comment).many());
  let eofComments = RegExp.concat(leadingSpaces, comments, trailingSpaces, eof);
  let entireLineComments = RegExp.concat(leadingSpaces, comments, trailingSpaces, newline);

  let lineCondComp = /\/\/@.*/;
  let blockCondComp = /\/\*@(?:[^*]|\*[^@]|\*@[^/])*@*\*\//;
  let doubleQuotedString = /"(?:[^\\"]|\\.)*"/;
  let singleQuotedString = /'(?:[^\\']|\\.)*'/;
  let regexLiteral = /\/(?![/*])(?:[^/\\[]|\\.|\[(?:[^\]\\]|\\.)*\])*\//;
  let anyChar = /[\S\s]/;

  let stripper = new Lexer();

  stripper.addRule(entireLineComments, Lexer.NULL_LEXEME);
  stripper.addRule(
    RegExp.concat(newline, entireLineComments.many(), eofComments), Lexer.NULL_LEXEME
  );

  stripper.addRule(
    RegExp.concat(comment, RegExp.concat(trailingSpaces, newline, eofComments).optional()), Lexer.NULL_LEXEME
  );

  stripper.addRule(lineCondComp, id);
  stripper.addRule(blockCondComp, id);
  stripper.addRule(doubleQuotedString, id);
  stripper.addRule(singleQuotedString, id);
  stripper.addRule(regexLiteral, id);
  stripper.addRule(anyChar, id);

  return stripper.lex(toBeStrippedStr).join("");
}

function setToString(set) {
  let str = "";
  for (let prop in set) {
    if (set.hasOwnProperty(prop) && set[prop]) {
      str += prop;
    }
  }
  return str;
}

function toSet(str) {
  let set = {};
  for (let i = 0; i < str.length; ++i) {
    set[str.charAt(i)] = true;
  }
  return set;
}

function union(set1, set2) {
  for (let prop in set2) {
    if (set2.hasOwnProperty(prop)) {
      set1[prop] = true;
    }
  }
  return set1;
}

function intersect(set1, set2) {
  for (let prop in set2) {
    if (set2.hasOwnProperty(prop) && !set2[prop]) {
      delete set1[prop];
    }
  }
  return set1;
}

function getFlags(rgx) {
  let flags = "";
  for (let i = 0; i < flagMap.length; ++i) {
    if (rgx[flagMap[i][0]]) {
      flags += flagMap[i][1];
    }
  }
  return flags;
};

function last(arr) {
  return arr[arr.length - 1];
};

function id(x) {
  return x;
}
