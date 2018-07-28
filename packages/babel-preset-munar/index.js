module.exports = {
  presets: [
    [require('@babel/preset-env').default, {
      targets: { node: 8 },
    }]
  ],
  plugins: [
    [require('@babel/plugin-proposal-decorators').default, {
      legacy: true
    }],
    [require('@babel/plugin-proposal-class-properties').default, {
      loose: true
    }],
    require('@babel/plugin-proposal-object-rest-spread').default,
    require('@babel/plugin-proposal-export-default-from').default,
    require('@babel/plugin-proposal-export-namespace-from').default
  ]
}
