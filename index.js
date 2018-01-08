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

function getTransformFn() {
    return function (file, options) {
        options = _.defaults(options, defaultPugOptions);
        
        if (!/\.(pug)$/.test(file)) return through();

        var data = '';
        return through(write, end);

        function write(buf) {
            data += buf;
        }

        function end() {
            var _this = this;
            transformTools.loadTransformConfig('pugvdomify', file, { fromSourceFileDir: true }, function (err, configData) {
                if (configData) {
                    var config = _.defaults(options, configData.config);
                }

                try {
                    var result = compile(file, data, config);
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
        var result = compile(filename, fs.readFileSync(filename, 'utf-8'), {});
        return module._compile(result, filename);
    };
}

function compile(file, pugText, options) {
    basedir = path.parse(file).dir;
    
    if (options.plugins) {
        var plugins = Array.isArray(options.plugins) ? options.plugins : [options.plugins];

        plugins = plugins.map(pluginObj => {
            try {
                var module = require(pluginObj._[0])
            } catch (err) {
                throw "Could not load plugin " + pluginObj._[0];
            }
            return module(pluginObj);
        });

        //For now, we are only supporting loader plugins.
        plugins = plugins.filter(plugin => {
            return plugin.lex || plugin.parse || plugin.resolve || plugin.read;
        });
        var opts = plugins.reduce((finalVal, plugin) => {
            Object.assign(finalVal, plugin);
            return finalVal;
        }, {});

        options = _.defaults(opts, options);
    }
    var result = "require('pug-vdom/runtime');\r\n module.exports = ";
    var ast = pugVDOM.ast(file, basedir, options);
    var func = 'function(locals, h){' + new pugVDOM.Compiler(ast).compile().toString() + 'return render(locals, h);}';
    result += func.toString();
    return result;
}
