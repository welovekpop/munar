module.exports = (api) => {
  api.cache.never()

  return {
    presets: [
      [require('@babel/preset-env').default, {
        targets: { node: 4 }
      }]
    ],
    plugins: [
      require('@babel/plugin-proposal-decorators').default,
      require('@babel/plugin-proposal-class-properties').default,
      require('@babel/plugin-proposal-object-rest-spread').default,
      require('@babel/plugin-proposal-export-default-from').default,
      require('@babel/plugin-proposal-export-namespace-from').default
    ]
  }
}
