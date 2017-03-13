# munar-plugin-media-blacklist

[Munar][] plugin for blacklisting media. Works with DJ Booth adapters like
[plug.dj][] and [üWave][].

## Installation

```shell
$ npm install --save munar-plugin-media-blacklist
```

## Commands

The Blacklist plugin adds chat commands for managing the blacklist. All commands
can only be used by moderators.

### `!blacklist add "<reason>"`

Add the current media to the blacklist.

**Example**

 - !blacklist add "This track has terrible audio quality."

### `!blacklist add <media> "<reason>"`

Add a specific media to the blacklist. `<media>` contains the source type and
source ID, separated by a colon `:`.

**Example**

 - !blacklist add youtube:nkMgmtU3rno "Video flickers A LOT. Please play an
   alternative version that doesn't cause headaches."

### `!blacklist remove <media>`

Remove a media from the blacklist. `<media>` contains the source type and
source ID, separated by a colon `:`.

**Example**

 - !blacklist remove youtube:qLphUlWywF4

## Usage

```json
{
  "plugins": [
    "media-blacklist"
  ]
}
```

## License

[ISC][]

[plug.dj]: ../munar-adapter-plugdj#readme
[üWave]: ../munar-adapter-uwave#readme
[Munar]: http://munar.space
[ISC]: ../../LICENSE
