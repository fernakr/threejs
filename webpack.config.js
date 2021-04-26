const path = require('path');
const pkg = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath = './build/';

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[hash].js'
  },
  mode: 'development',
  target: 'web',
  devtool: 'source-map',
  // resolve: {
  //   extensions: ['.tsx', '.ts', '.js']
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|obj|mat|mp3|ogg|fbx)$/i,
        use: 'file-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({'title': 'three-seed project'})
  ]
}
