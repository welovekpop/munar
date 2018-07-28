module.exports = (api) => {
  api.cache.never()

  return {
    presets: [
      require('./packages/babel-preset-munar')
    ]
  }
}
