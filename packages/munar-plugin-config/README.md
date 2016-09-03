# munar-plugin-config

[Munar] plugin for managing plugin options at runtime.

## Installation

```shell
$ npm install --save munar-plugin-config
```

## Usage

Add the `config` plugin at the very top of your plugins list, and list other
plugins _without_ options:

```js
{
  "plugins": [
    ["config", { "enable": true }],
    "triggers",
    "chat-log",
    "greetings"
  ]
}
```

`munar-plugin-config` will initialise them with the correct configuration.

## Configuration

Show the current configuration for a plugin using `!config get pluginname`. Show
a single option using `!config get pluginname optionname`. For example, `!config
get emotes url`.

Set an option using `!config set pluginname optionname value`. For example,
`!config set emotes reupload true`.

Add an option to a list configuration using `!config add pluginname optionname
value`, eg `!config add reddit-feed subreddits pics`.

Remove an option from a list configuration using `!config remove pluginname
optionname value`, eg `!config remove reddit-feed subreddits pics`.

## License

[ISC]

[Munar]: http://munar.space
[ISC]: ../../LICENSE
