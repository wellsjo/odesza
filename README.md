# Odesza

Odesza is a templating engine that allows you to write clean, expressive templates with inline JavaScript.

- multiple inheritance (extends, includes, blocks)
- full access to inline ES6 JavaScript
- support for Express
- no magic or new language to learn

### Inspiration
I find learning templating languages to be more of a hassle than just writing the HTML.  Hence, there is no magic or shorthand code in Odesza templates.  Odesza simply provides a structure for you to write complex templating systems without having to learn a new language.  Simply put, it offers the flexibility of multiple inheritance and inline programming logic with the familiarity of writing plain HTML and JS.  

### Variables & Expressions
Variables are passed in when Odesza templates are rendered. Scope is maintained through includes and extends.  You can also treat `${}` as a function statement.  

**hello.ode**
```javascript
<title>${title}</title>
<p>
  Welcome, ${names.map(n => `<i>${n}</i>`).join(', ')}!
</p>
```
**code**
```javascript
var vars = {
  title: 'hello world',
  names: ['foo', 'bar']
};

odesza.compile('hello.ode', vars);
```
**output**
```html
<title>hello world</title>
<p>
  Welcome, <i>foo</i>, <i>bar</i>
</p>
```

### Inline JavaScript
Odesza makes it easy to write inline JavaScript in your templates.  Under the hood, templates are evaluated as ES6 template strings, which means you have access to `${}` expressions.  If you need more flexibility with inline js, you can create a self-executing function expression with code inside it like this: `${(() => { ... })()}`.

**greetings.ode**
```javascript
<h2>welcome ${names.join(', ')}!</h2>

${(() => {

  // this is a self-executing function expression inside an ES6 template string.
  // essentially that means you can write any inline js you want here. the
  // following code is to demonstrate how you can programatically generate HTML.

  var items = [];

  names.forEach((name, index) => {
    items.push(`<div>${index + 1}: ${name}</div>`)
  });

  return items.join('<br/>');

})()}
```
**code**
```javascript
var vars = {
  names: ['wells', 'joe', 'dom']
};

odesza.compile('greetings.ode', vars);
```
**output**
```html
<h2>welcome wells, joe, dom!</h2>
<div>1: wells</div><br/>
<div>2: joe</div><br/>
<div>3: dom</div>
```

### Partials
Odesza makes it easy to nest templates within each other.  You can include templates as many levels deep as you like. Variables maintain scope in included files.

**greeting.ode**
```javascript
hello!
```
**welcome.ode**
```javascript
include greeting

welcome, ${name}!
```
**question.ode**
```javascript
include welcome

would you like to play a game, ${name}?
```
**code**
```javascript
var vars = {
  name: 'foo'
};

odesza.compile('question,ode', vars);
```
**output**
```
hello!
welcome, foo!

would you like to play a game, foo?
```

### Inheritance
Odesza gives you access to multiple inheritance through extending templates and block scopes.  

**layout.ode**
```html
<!doctype html>

<html>
  <head>
    <title>${title}</title>
    block js
  </head>
  <body>
    block content
  </body>
</html>
```
**page.ode** (extends layout.ode)
```html
extends layout

block js
<script src="${base_path}/page.js"></script>
endblock

block content
<p>
  Some content.
</p>
endblock
```
**extended_page.ode** (extends page.ode, overwrites 'content' block)
```html
extends page

block content
<p>
  Overwritten content.
</p>
endblock
```
**code**
```javascript
var vars = {
  title: 'hello world',
  base_path: 'public/js'
};

odesza.compile('extended_page.ode', vars);
```
**output**
```html
<!doctype html>

<html>
  <head>
    <title>hello world</title>
    <script src="public/js/page.js"></script>
  </head>
  <body>
    <p>
      Overwritten content.
    </p>
  </body>
</html>
```

### Express Support
**index.js**
```javascript
app.set('view engine', 'ode');
app.engine('.ode', require('odesza').__express);
```
**controller**
```javascript
res.render('template', {
  foo: 'bar'
});
```

### Command Line
You can compile odesza templates from the command line to `stdout` or an output file.
```
odesza <file> [-o <output>]
```

### Install
```
npm install odesza --save
```

### License
MIT
