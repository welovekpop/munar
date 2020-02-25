module.exports = {
  presets: [
    [require('@babel/preset-env').default, {
      targets: { node: 12 },
    }]
  ],
  plugins: [
    [require('@babel/plugin-proposal-decorators').default, { decoratorsBeforeExport: false }],
    require('@babel/plugin-proposal-class-properties').default,
    require('@babel/plugin-proposal-export-default-from').default,
    require('@babel/plugin-proposal-export-namespace-from').default
  ]
}
