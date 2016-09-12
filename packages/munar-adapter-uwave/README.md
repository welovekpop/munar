# munar-adapter-uwave

[Munar] Adapter for [üWave] servers.

## Installation

```shell
$ npm install --save munar-adapter-uwave
```

## Usage

```js
{
  "adapters": [
    ["uwave", {
      "api": "https://u-wave.net/v1",
      "socket": "wss://u-wave.net",
      // Using an authentication token:
      "token": "<jwt>",
      // Or an email address and password:
      "email": "your@email.address",
      "password": "123456"
    }]
  ]
}
```

## License

[ISC]

[Munar]: http://munar.space
[üWave]: https://u-wave.github.io/
[ISC]: ../../LICENSE
