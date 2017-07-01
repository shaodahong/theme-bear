var Webpack = require('webpack')
var path = require('path')
var glob = require('glob')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var HtmlWebpackInlineAssetsPlugin = require('html-webpack-inline-assets-plugin')

var isPro = process.env.NODE_ENV === 'production'

/*
    base config
*/
var baseConfig = {
    entry: {},
    output: {
        path: path.resolve(__dirname, '../dist'),
        publicPath: '',
        filename: isPro ? 'static/js/[name].[chunkhash].js' : 'static/js/[name].js'
    },
    resolve: {
        extensions: ['*', '.js', '.json'],
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime']
                }
            },
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            })
        }, {
            test: /\.json$/,
            use: 'json-loader'
        }, {
            test: /\.styl/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    'css-loader',
                    'stylus-loader'
                ]
            }),
        }, {
            test: /\.less/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    'css-loader',
                    'less-loader'
                ]
            }),
        }, {
            test: /\.scss/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    'css-loader',
                    'sass-loader'
                ]
            }),
        }, {
            test: /\.html$/,
            use: {
                loader: 'html-loader',
            }
        }, {
            test: /\.(png|jpg|jpeg|gif|ico)$/i,
            use: {
                loader: "url-loader",
                options: {
                    limit: 10000,
                    name: 'static/images/[name].[hash:6].[ext]',
                    publicPath: '../../',
                }
            }
        }, {
            test: /\.(svg|woff|woff2|ttf|eot)$/i,
            use: {
                loader: "file-loader",
                options: {
                    name: 'static/fonts/[name].[hash:6].[ext]',
                    publicPath: '../../',
                }
            }
        }]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'static/css/[name].[contenthash].css',
            allChunks: true,
            disable: isPro ? false : true
        })
        // new BundleAnalyzerPlugin()
        // new Webpack.optimize.ModuleConcatenationPlugin()
    ]
}

/**
 * 
 * 
 * @param {string} globPath 
 * @returns {object}
 */
function getEntries(globPath) {
    var files = glob.sync(globPath),
        entries = {};

    files.forEach(function (filepath) {
        var split = filepath.split('/');
        var name = split[split.length - 2];

        entries[name] = filepath;
    });

    return entries;
}

var entries = getEntries('./src/pages/*/index.js');
var hot = 'webpack-hot-middleware/client?reload=true';

entries['index'] = './src/index.js'

console.log('  entries', entries)

var entriesLength = Object.keys(entries).length;

// Single entry or multiple entry
if (entriesLength === 1) {
    Object.keys(entries).forEach(function (name) {
        baseConfig.entry[name] = isPro ? entries[name] : [hot, entries[name]];
        var htmlPlugin = new HtmlWebpackPlugin({
            filename: name + '.html',
            template: name === 'index' ? './src/index.html' : './src/pages/' + name + '/index.html',
            inject: true,
            chunks: [name, 'vendor', 'manifest'],
            chunksSortMode: 'dependency',
        });
        baseConfig.plugins.push(htmlPlugin);
    })
    baseConfig.plugins.push(new Webpack.optimize.CommonsChunkPlugin({
        name: ['vendor'],
        minChunks: (module, count) => (
            module.resource &&
            module.resource.indexOf('node_modules') >= 0 &&
            module.resource.match(/\.js$/)
        )
    }))
} else {
    Object.keys(entries).forEach(function (name) {
        baseConfig.entry[name] = isPro ? entries[name] : [hot, entries[name]];
        var htmlPlugin = new HtmlWebpackPlugin({
            filename: name + '.html',
            template: name === 'index' ? './src/index.html' : './src/pages/' + name + '/index.html',
            inject: true,
            chunks: [name, name + '.vendor', 'vendor', 'manifest'],
            chunksSortMode: 'dependency',
        });
        var commonPlugin = new Webpack.optimize.CommonsChunkPlugin({
            name: [name + '.vendor'],
            chunks: [name],
            minChunks: (module, count) => (
                module.resource &&
                module.resource.indexOf('node_modules') >= 0 &&
                module.resource.match(/\.js$/) &&
                count === 1
            )
        })
        baseConfig.plugins.push(htmlPlugin, commonPlugin);
    })
    baseConfig.plugins.push(new Webpack.optimize.CommonsChunkPlugin({
        name: ['vendor'],
        minChunks: (module, count) => (
            count >= 2
        )
    }))
}

baseConfig.plugins.push(new Webpack.optimize.CommonsChunkPlugin({
    name: ['manifest'],
    minChunks: Infinity
}))
baseConfig.plugins.push(new HtmlWebpackInlineAssetsPlugin({
    head: 'manifest.',
    // body: 'manifest.'
}))


module.exports = baseConfig;