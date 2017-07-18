var fs = require("fs");
var path = require('path');
var webpack = require('webpack');

var srcDir = path.join(__dirname, 'src');
var assetsDir = path.join(__dirname, 'app/assets');

var ExtractTextPlugin = require("extract-text-webpack-plugin");
var DirectoryNameAsMain = require('webpack-directory-name-as-main');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var minimize = process.argv.indexOf('--minimize') >= 0;
var watch = process.argv.indexOf('--no-watch') < 0;
var sourceMap = process.argv.indexOf('--source-map') >= 0;

var config = {
    entry: {
        main: path.join(srcDir, 'main.js')
    },
    plugins: [
        new ExtractTextPlugin("[name].css"),
        new webpack.ResolverPlugin([
            new DirectoryNameAsMain()
        ]),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),
        new CopyWebpackPlugin([
            { from: path.join(srcDir, 'index.html'), to: '../' },
        ], {copyUnmodified: true})
    ],
    output: {
        path: assetsDir,
        filename: "[name].js"
    },
    resolve: {
        root: path.resolve(srcDir),
        modulesDirectories: [
            path.join(__dirname, 'node_modules')
        ],
        extensions: ['', '.js'],
        alias: {
            'babel-polyfill': path.join(__dirname, 'babel-polyfill/dist/polyfill.js')
        }
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ["es2015"]
                }
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(
                    'style',
                    `css!autoprefixer-loader?{browsers:["last 2 versions","> 5%"]}!sass-loader?includePaths[]=` + path.resolve(__dirname, "./node_modules/compass-mixins/lib")
                )
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract(
                    'style',
                    `css!autoprefixer-loader?{browsers:["last 2 versions","> 5%"]}!less`
                )
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            { test: /\.(jpg|png|gif)$/, loader: "file-loader?name=images/[name].[md5:hash:base58:8].[ext]" },
            { test: /\.(woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9]+)?$/, loader: "url-loader?limit=10000&minetype=application/font-woff&name=fonts/[name].[md5:hash:base58:8].[ext]" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9]+)?$/, loader: "file-loader?name=fonts/[name].[md5:hash:base58:8].[ext]" }
        ]
    }
};

minimize && config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle: {
        except: ['$super', '$', 'exports', 'require']
    }
}));

var compiler = webpack(config);

var statOpts = {
    hash: true,
    timing: true,
    assets: true,
    chunks: false,
    children: false,
    version: false
};
if (watch) {
    compiler.watch({}, function (err, stats) {
            console.log(stats.toString(statOpts));
        }
    );
} else {
    compiler.run(function (err, stats) {
        console.log(stats.toString(statOpts));
    });
}