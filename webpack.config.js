const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  // Load environment variables from .env file
  const envVars = dotenv.config().parsed || {};
  
  // Extract environment variables that start with REACT_APP_
  const reactEnv = Object.keys(envVars)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((obj, key) => {
      obj[`process.env.${key}`] = JSON.stringify(envVars[key]);
      return obj;
    }, {});

  // Default values in case .env is missing
  reactEnv['process.env.REACT_APP_ONCADE_API_KEY'] = reactEnv['process.env.REACT_APP_ONCADE_API_KEY'] || JSON.stringify('');
  reactEnv['process.env.REACT_APP_ONCADE_GAME_ID'] = reactEnv['process.env.REACT_APP_ONCADE_GAME_ID'] || JSON.stringify('');
  
  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist/client'),
      filename: '[name].[contenthash].js',
      clean: true,
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                moduleResolution: 'node',
                jsx: 'react-jsx',
                esModuleInterop: true,
              }
            }
          }
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|glb|gltf)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/assets/favicon.ico',
        meta: {
          'og:title': { property: 'og:title', content: 'Oncade Game' },
          'og:description': { property: 'og:description', content: 'Play this amazing game powered by Oncade' },
          'og:image': { property: 'og:image', content: '/assets/og-image.png' },
          'og:url': { property: 'og:url', content: 'https://game.oncade.com' },
          'twitter:card': { name: 'twitter:card', content: 'summary_large_image' }
        }
      }),
      // Make environment variables available to the client-side code
      new webpack.DefinePlugin(reactEnv)
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx']
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      historyApiFallback: true,
      port: 3000,
      hot: true,
      proxy: {
        '/api': 'http://localhost:8080',
        '/socket': {
          target: 'ws://localhost:8080',
          ws: true
        }
      }
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map'
  };
}; 