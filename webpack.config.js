
var webpack = require('webpack');

var PROD = JSON.parse(process.env.PROD_ENV || '0');

module.exports = {
  entry: ['./src/pucko.ts' ],
  output: {
    library: 'Pucko',
    filename: 'pucko.js'
  },
  resolve: {
    extensions: ['.ts']
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  plugins: PROD ? [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false, dead_code: true },
    })
  ] : []
}
