# munar-helper-booth-lockskip

Helper function for "lock-skipping" DJs in [Munar] plugins.

Intended for Adapters with a DJ Booth and a DJ History, like [plug.dj] or
[üWave].

## Installation

```shell
$ npm install --save munar-helper-booth-lockskip
```

## Usage

```js
import lockskip from 'munar-helper-booth-lockskip'

// Skip DJ and move them to the second position in the wait list
await lockskip(adapter)

// Skip DJ and move them to a custom (zero-indexed) position in the wait list
await lockskip(adapter, { position: 5 })
```

## License

[ISC]

[Munar]: http://munar.space
[plug.dj]: https://npmjs.com/package/munar-adapter-plugdj
[üWave]: https://npmjs.com/package/munar-adapter-uwave
[ISC]: ../../LICENSE
