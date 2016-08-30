module.exports = {
  presets: [
    require('babel-preset-es2015-node4'),
    require('babel-preset-es2016'),
    require('babel-preset-es2017'),
    require('babel-preset-stage-2')
  ],
  plugins: [
    require('babel-plugin-transform-decorators-legacy').default,
    require('babel-plugin-transform-export-extensions')
  ]
}
