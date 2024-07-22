const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');


module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  return {
    entry: './index.web.js',
      output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      publicPath: '/', // Necessary for proper client-side routing
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['module:metro-react-native-babel-preset'],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
      },
      extensions: ['.web.js', '.js', '.jsx', '.json'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'public/index.html',
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      historyApiFallback: true,
      compress: true,
      port: 9000,
    },
    performance: {
      maxAssetSize: 5120000, // Increase the limit as per your need
      maxEntrypointSize: 5120000, // Increase the limit as per your need
    },
    devtool: isDevelopment ? 'inline-source-map' : 'source-map', // Source map for easier debugging
    mode: isDevelopment ? 'development' : 'production', // Mode configuration
  }
};
