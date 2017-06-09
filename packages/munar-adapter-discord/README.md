# munar-adapter-discord

[Munar][] Adapter for [Discord][].

## Installation

```shell
$ npm install --save munar-adapter-discord
```

## Usage

```js
{
  "adapters": [
    ["discord", {
      // The ID of your server, as a string. (IDs are too big to be accurately represented as JavaScript numbers.)
      "guild": "147606580113792714",
      // Your Bot Account Token.
      // See https://abal.moe/Eris/docs/getting-started for how to get a Bot Token.
      "token": "axmkv4zjegp30jzvno683iqykhe0klxn903zgw7jjbvkozdk5vc3039b5nn"
    }]
  ]
}
```

## License

[ISC][]

[Munar]: http://munar.space
[Discord]: https://discordapp.com/
[ISC]: ../../LICENSE

