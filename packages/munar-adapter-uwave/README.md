# munar-adapter-uwave

[Munar] Adapter for [üWave] servers.

## Installation

```shell
$ npm install --save munar-adapter-uwave
```

## Usage

```json
{
  "adapters": [
    ["uwave", {
      "api": "https://u-wave.net/v1",
      "socket": "wss://u-wave.net",
      "token": "<your JWT>"
    }]
  ]
}
```

## License

[ISC]

[Munar]: http://munar.space
[üWave]: https://u-wave.github.io/
[ISC]: ../../LICENSE
