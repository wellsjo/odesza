# Odesza
The aim is to extend ES6 [template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to be a fully featured templating engine. Since everything is parsed as a template string under the hood, the code is short and easy to understand, and you don't need to learn anything except JavaScript syntax.  
- multiple inheritance (partials, block scope, extends)
- inline ES6 JavaScript
- support for Express

## Usage
Odesza can be used to render anything like sql or html. From code or the command line.
```javascript
const odesza = require('odesza');

odesza.render('hello, ${name}', { name: 'foo' });
// hello, foo

// or render a template from a file
odesza.renderFile('template.ode', { name: 'foo'});
```

## Variables
Variables work the same as JavaScript template strings, surrounded by `${}`.
```javascript
odesza.render('hello ${name}', { name: 'world' });
// hello world
```


## JavaScript
You can use JavaScript just like in template strings
```javascript
odesza.render('hello ${names.join(', ')}', { names: ['wells', 'joe'] });
// hello wells, joe
```
You can also write more complicated inline functions
```javascript
// template.ode
${(() => {

  // Generates line-break separated list items based on a "names" array
  return names.map((name, index) => {
    items.push(`<div>${index + 1}: ${name}</div>`);
  }).join('<br/>');
})()}
```
**Output:**
```html
<div>1: wells</div><br/>
<div>2: joe</div><br/>
<div>3: dom</div><br/>
```

## Partials
Include an odesza template inside another, for any number of levels.
```javascript
odesza.renderFile('welcome.ode', { name: 'foo' });
```
```javascript
// welcome.ode
include greeting
Welcome, ${name}!
```
```javascript
// greeting.ode
Hello!
```
**Output:**
```
Hello!
Welcome, foo
```

### Block Scope
Block scopes allow you to define a base template, so you can extend it and create many similar templates. In the base template, you create a block using `block <block-name>`.  In another "extended" template, you can speficy the contents of the blocks using the `extends` keyword. Odesza enables you to extend a template as many times and levels as you want.
```javascript
odesza.renderFile('page', {
  title: 'hello world'
});
```
```javascript
// page.ode
extends layout

block content
<p>
  Some content.
</p>
endblock
```
```javascript
// layout.ode
<head>
  <title>${title}</title>
</head>
<body>
  block content
</body>
```
**Output:**
```html
<head>
  <title>hello world</title>
</head>
<body>
  <p>
    Some content.
  </p>
</body>
```

## Comments
Comments work the same as in Javascript, and are ignored from the template output.
```javascript
// line comments

/* inline comments */

/**
 * block comments
 */
```

## Express Support
```javascript
app.set('view engine', 'ode');
app.engine('.ode', require('odesza').__express);
```
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
project
```
npm i odesza --save
```
globally
```
npm i odesza -g
```

### License
MIT
