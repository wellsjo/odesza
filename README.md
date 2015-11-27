# odesza

*odesza* allows you to write clean, familiar-looking templates using plain HTML and JavaScript.  Under the hood, content is rendered as ES6 template strings, which allows you to write native JS inline with your HTML.  Odesza supports Express out of the box.

```javascript
var odesza = require('odesza');

var options = {
  name: 'world'
};

odesza.render('hello ${name}!', options); // hello world!
```

##Install
```
npm install odesza --save
```
##Express Support
server.js
```javascript
app.set('view engine', 'odesza');
```
