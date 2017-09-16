var fs = require('fs');
var _ = require('lodash');
var pug = require('pug');
var through = require('through');
var transformTools = require('browserify-transform-tools');
var path = require('path');
var pugVDOM = require('pug-vdom');
var h = require('virtual-dom/h');

var defaultPugOptions = {
    path: __dirname,
    compileDebug: true,
    pretty: true,
    h: h
};

function getTransformFn(options) {
    var key;
    options = _.defaults(options, defaultPugOptions);

    return function (file) {
        if (!/\.(pug)$/.test(file)) return through();

        var data = '';
        return through(write, end);

        function write(buf) {
            data += buf;
        }

        function end() {
            var _this = this;
            configData = transformTools.loadTransformConfig('pugvdomify', file, { fromSourceFileDir: true }, function (err, configData) {
                if (configData) {
                    options = _.defaults(options, configData.config);
                }

                try {
                    var result = compile(file, data, options);
                    _this.queue(result);
                } catch (e) {
                    _this.emit("error", e);
                }
                _this.queue(null);
            });
        }
    };
}

module.exports = getTransformFn();
module.exports.root = null;
module.exports.register = register;

function register() {
    require.extensions['.pug'] = function (module, filename) {
        var result = compile(fs.readFileSync(filename, 'utf-8'), {});
        return module._compile(result, filename);
    };
}

function compile(file, pugText, options) {
    basedir = path.parse(file).dir;
    var result = "module.exports = ";
    var ast = pugVDOM.ast(file, basedir);
    var func = 'function(locals, h){' + new pugVDOM.Compiler(ast).compile().toString() + 'return render(locals, h);}';
    result += func.toString();
    return result;
}
