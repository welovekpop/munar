# munar-adapter-plugdj

[Munar] Adapter for [plug.dj].

## Installation

```shell
$ npm install --save munar-adapter-plugdj
```

## Usage

```js
{
  "adapters": [
    ["plugdj", {
      "room": "<your-plugdj-room>",
      // The rest of the options are treated as a Plugged login credentials
      // object. See https://github.com/SooYou/plugged/wiki/%5BFUNCTION%5D-login
      "email": "my-plugdj-bot@plug.dj",
      "password": "qwerty123",
      // Or, using Facebook login:
      "userID": "345634514",
      "accessToken": "<your token>"
    }]
  ]
}
```

## License

[ISC]

[Munar]: http://munar.space
[plug.dj]: https://plug.dj/
[ISC]: ../../LICENSE
