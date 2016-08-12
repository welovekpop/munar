# munar-plugin-dj-history-skip

[Munar] plugin that auto-skips songs that are in the play history.

Intended for Adapters with a DJ Booth and a DJ History, like [plug.dj] or
[üWave].

## Installation

```shell
$ npm install --save munar-plugin-dj-history-skip
```

## Usage

```js
{
  "plugins": [
    ["dj-history-skip", {
      // Amount of songs to look back in the history.
      "limit": 50,
      // Waitlist position to move a skipped user to, if the adapter has a
      // Waitlist.
      "lockskipPosition": 1
    }]
  ]
}
```

## License

[ISC]

[Munar]: http://munar.space
[plug.dj]: https://npmjs.com/package/munar-adapter-plugdj
[üWave]: https://npmjs.com/package/munar-adapter-uwave
[ISC]: ../../LICENSE
