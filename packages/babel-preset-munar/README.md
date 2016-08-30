# babel-preset-munar

Babel preset with useful default configuration for Munar plugins.

Includes:

 - [es2015] preset for Node 4+
 - [es2016] preset
 - [es2017] preset
 - [Stage 2] plugins (like class properties and object spread)
 - [Legacy decorators], to use the `@command` decorator

## Usage

In your `.babelrc`:

```json
{
  "presets": ["munar"]
}
```

## License

[ISC]

[es2015]: https://npmjs.com/package/babel-preset-es2015-node4
[es2016]: https://npmjs.com/package/babel-preset-es2016
[es2017]: https://npmjs.com/package/babel-preset-es2017
[Stage 2]: https://npmjs.com/package/babel-preset-stage-2
[Legacy decorators]: https://npmjs.com/package/babel-plugin-transform-decorators-legacy
[ISC]: ../../LICENSE
