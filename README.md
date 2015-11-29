# Odesza

Odesza allows you to write clean, expressive templates with inline JavaScript.  It offers the flexibility of multiple inheritance and inline programming logic with the simplicity of writing plain HTML and JS.

**Offers**  
- multiple inheritance
- variables
- fully expressive inline JavaScript
- support for Express
- no magic, 0 dependencies, and just 150 lines of code

#Install
```
npm install odesza --save
```

# Variables
Variables are passed in when Odesza templates are rendered. Scope is maintained through includes and extends.
```javascript
var vars = {
  name = 'world'
};

odesza.render('hello, ${name}', vars); // hello world
```

#Inline JS
Odesza makes it easy to write inline JavaScript in your templates.  Under the hood, templates are evaluated as ES6 template strings, which means you have access to `${}` expressions.  

**code**
```javascript
var vars = {
  names: ['wells', 'joe', 'dom']
};

odesza.compile('greetings.ode', vars);
```
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
**output**
```html
<h2>welcome wells, joe, dom!</h2>
<div>1: wells</div><br/>
<div>2: joe</div><br/>
<div>3: dom</div>
```
# Partials
**welcome.ode**
```javascript
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

odesza.compile('question', vars);
```
**output**
```
welcome, foo!

would you like to play a game, foo?
```

# Inheritance
Odesza gives you access to multiple inheritance through extending templates and block scopes.  

**layout.ode**
```jade
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
extend layout

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
extend page

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
#Express Support
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
#License
MIT
