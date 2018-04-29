module.exports = (api) => {
  api.cache.forever()

  return {
    presets: [
      require('./packages/babel-preset-munar')
    ]
  }
}
