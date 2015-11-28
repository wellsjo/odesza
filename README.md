# Odesza

**Odesza** allows you to write clean, expressive templates with just HTML and inline JavaScript without any learning curve.

It offers  
- multiple inheritence
- fully expressive inline JavaScript
- native support for Express framework
- no magic, 0 dependencies, and just 150 lines of code

It does NOT offer
- HTML shorthand
- special functions

##Install
```
npm install odesza --save
```
##Render
```javascript
var odesza = require('odesza');
var vars = {
  name: 'world'
};
odesza.render('hello ${name}!', vars); // hello world!
```
##Compile
Compile odesza files.  Odesza first tries the literal path given, then *.ode*, then *.odesza*.  

*index.odesza*
```
hello ${name}!
```
```javascript
var odesza = require('odesza');
var vars = {
  name: 'world'
};
odesza.compile('index', vars); // hello world!
```
##Express
server.js
```javascript
app.set('view engine', 'odesza');
```
