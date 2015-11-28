# odesza

*odesza* allows you to write clean, familiar-looking templates using plain HTML and JavaScript.  Under the hood, content is rendered as ES6 template strings, which allows you to write native JS inline with your HTML.  Odesza supports Express out of the box.

##Inspiration
I use templating languages for two reasons.  The first reason is the ability to import or extend templates, and organize them in such a way that maximizes reusability.  The second reason is the ability to use programming logic in the generation of HTML.  
Many templating languages offer this functionality with special keyword operators, such as ```each```.


```javascript
var odesza = require('odesza');

var options = {
  name: 'world'
};

odesza.render('hello ${name}!', options); // hello world!
``e

##Install
```
npm install odesza --save
```
##Express Support
server.js
```javascript
app.set('view engine', 'odesza');
```
