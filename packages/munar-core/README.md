# munar-core

[Munar] core: Plugin, Adapter and Chat Command management.

You only need to use `munar-core` directly if you're developing an Adapter or
Plugin. Otherwise, the [Munar CLI] may be more useful to you.

## Installation

```shell
$ npm install --save munar-core
```

## Usage

```js
import { Plugin } from 'munar-core'
export default class MyPlugin extends Plugin {
  // etc
}
```

## License

[ISC]

[Munar]: http://munar.space
[Munar CLI]: ../munar/
[ISC]: ../../LICENSE
