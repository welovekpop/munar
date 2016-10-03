# munar

CLI for running [Munar] bots.

## Installation

```shell
$ npm install --global munar
```

## Usage

```shell
munar path/to/bot/config.json
```

## Config

Configuration files can be [JSON5] files, or Node.js modules that export a
configuration object.

```js
{
  "mongo": "url",
  "adapters": [
    ["adapter-name", {
      "adapter-option": "value",
    }],
  ],
}
```

```js
module.exports = {
  adapters: [
    ['slack', {
      token: process.env.SLACK_TOKEN,
    }],
  ],
}
```

### `mongo`

String URL to a MongoDB database. Any string that's accepted by [Mongoose] is
allowed.

### `adapters`

Array of Adapters to use. Adapters can be identified by their module name.
Module names are automatically prefixed with `munar-adapter-` if necessary.

```js
{
  "adapters": [
    "slack", // Resolves to munar-adapter-slack
    "munar-adapter-plugdj", // Resolves to munar-adapter-plugdj
  ],
}
```

Most adapters take options, such as login credentials. Options can be passed by
using an array of `[name, options]`:

```js
{
  "adapters": [
    ["slack", { "token": "xoxb-<secret>" }],
    ["munar-adapter-plugdj", {
      "room": "the-chillout-room",
      /* + login credentials */
    }],
  ],
}
```

You can find more adapters with the [munar-adapter keyword on npm][munar-adapter].

### `plugins`

Array of plugins to use. Plugins are identified and configured similarly to
adapters. Plugin names are automatically prefixed with `munar-plugin-` if
necessary.

```js
{
  "plugins": [
    "greetings",
    ["reddit-feed", {
      "subreddits": ["listentothis"],
    }],
    ["munar-plugin-karma", {
      // Enable this plugin by default.
      "enable": true,
    }],
  ],
}
```

Plugins can be enabled and disabled at runtime using the `!enable pluginname`
and `!disable pluginname` commands. By default, plugins are disabled. However,
all plugins take an option `enable` to change this behaviour, so that they will
be enabled by default. (In the future, plugins might be enabled by default.)

You can find more plugins with the [munar-plugin keyword on npm][munar-plugin].

## License

[ISC]

[Munar]: http://munar.space
[JSON5]: https://www.npmjs.com/package/json5
[Mongoose]: http://mongoosejs.com/docs/connections.html
[munar-adapter]: https://www.npmjs.com/browse/keyword/munar-adapter
[munar-plugin]: https://www.npmjs.com/browse/keyword/munar-plugin
[ISC]: ../../LICENSE
