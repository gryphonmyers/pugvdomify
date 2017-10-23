# pugvdomify
Browserify transform to compile pug files into functions returning virtual-dom nodes.

Add it as you would any other browserify transform. Use the global flag if you think there is a possibility you will be requiring external modules that require pug files.
```javascript
var bundler = browserify();
bundler.transform(pugvdomify, {global:true});
//... run your bundle etc
```
In your modules you can now do
```javascript
var myTemplateFunc = require('./my-pug-file.pug');
var myVNodes = myTemplateFunc({myLocal: "etc"}); //returns an array of virtual-dom nodes
```
