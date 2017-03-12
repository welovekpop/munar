# munar-plugin-serve

[Munar][] plugin that adds a web interface.

## Installation

```shell
$ npm install --save munar-plugin-emotes
```

## Usage

```json
{
  "plugins": [
    ["serve", {
      // Required: The URL that you will access your server through.
      "baseUrl": "http://my-website.com/munar/",
      // Defaults to 3000
      "port": 80
    }]
  ]
}
```

## For Plugin Developers

Plugins can define a `serve` method, which is handled by [Micro][]:

```js
class MyPlugin extends Plugin {
  async serve (req, res, micro) {
    // Objects are returned as JSON
    return { key: 'value' }

    // Text is returned as-is
    return '<h1>Hello World</h1>'

    // `micro` contains helper methods from the Micro module
    const inputParams = await micro.json(req)
    throw micro.createError(403, 'You shall not pass!')
    micro.send(res, 204, null)
  }
}
```

You can serve anything--files, a JSON API, a full web app, you name it. Your
web service will be available at `$baseUrl/$pluginName/`. If your `baseUrl` is
http://example.com/munar, the service for the `emotes` plugin can be found at:

http://example.com/munar/emotes

## License

[ISC][]

[Munar]: https://munar.space
[Micro]: https://github.com/zeit/micro#readme
[ISC]: ../../LICENSE
