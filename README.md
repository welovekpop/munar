# SekshiBot
Modular plug.dj room bot for [WE ♥ KPOP](https://plug.dj/loves-kpop).

![SekshiBot](https://i.imgur.com/NzTEsiU.png)

## Installation

```
git clone https://github.com/welovekpop/SekshiBot
cd SekshiBot
npm install
```

## Configuration

1. Copy `config.json.example` to `config.json`
1. Set your room name and mongo database in `config.json`
1. Copy `creds.json.example` to `creds.json`
1. Update your bot account credentials in `creds.json`

Module-specific configuration is kept in the `/.config` directory.
Modules are configured at runtime, using the `!get` and `!set` commands.
`!get` takes a module name and an option name, `!set` takes a module
name, an option name and a value.

```
!get historyskip limit
→ Responds with 50 by default
!set roulette winPosition 1
→ Roulette will now move the winner to position 1 instead of 2
```

## Running

Sekshi uses some fancy-ES6-of-the-future, so you need to get that
transpiled into poor-lady's-JS-of-today (aka ES5) first, using
[Babel](https://babeljs.io). For convenience, we've got these commands:

* Just transpiling: `npm run-script babel` Outputs
  poor-lady's-JS-of-today in `lib/`.
* Running transpiled code: `npm run-script start` (So you need to run
  ^ first for this)
* Running the bot while transpiling on the fly:
  `npm run-script babel-start`

The last one is nice for testing, the first two are nice for actually
running things.

Also, if you like, you can enable debug information by setting the
`DEBUG` environment variable:
(Thanks to the [debug](https://npmjs.com/package/debug) module)
```
# outputs debug information from Sekshi and dependencies
DEBUG=* npm run-script babel-start
# only outputs debug information from Sekshi
DEBUG=sekshi:* npm run-script babel-start
```

If you wish to run it in your own room, it's probably a good idea to
use [forever](https://npmjs.com/package/forever). First transpile
Sekshi using `npm run-script babel`, then use `forever start lib/app`
and you should be good to go!

## Making modules

Sekshi autoloads modules from the `src/modules` directory. Just make
sure your file name ends in `.module.js`, and that your module class
inherits from `src/Module`! Modules should generally look like:

```javascript
// src/modules/MyModule.module.js
const debug = require('debug')('sekshi:my-module')
const SekshiModule = require('../Module')
// <your requires here>

export default class MyModule extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    // semi-optional data, will be shown in !moduleinfo:
    this.author = 'Me!'
    this.version = '0.1.1'
    this.description = 'This is a module!'

    // Command access levels. Commands can only be executed by users
    // if the command names exist in this object.
    // For user roles, see the Sooyou/plugged documentation
    this.permissions = {
      // Anyone can use this command:
      who: sekshi.USERROLE.NONE,
      // Only bouncers and up can use this command:
      why: sekshi.USERROLE.BOUNCER
    }
  }

  // the init() hook will be run when the module is enabled:
  init() {
    // your own initialisation!
    // Maybe you want to add some event handlers, or start a timer...
  }

  // and the destroy() hook will be run when the module is disabled:
  destroy() {
    // detach any event listeners here, if you have them
  }

  // the commands defined in `this.permissions` map straight to these
  // methods:
  // `sender` is a Sooyou/plugged user object.
  who(sender) {
    this.sekshi.sendChat(`@${sender.username} It's Meeee! ` +
                         `With my very own module!`)
  }

  why(sender) {
    this.sekshi.sendChat(`@${sender.username} Omg. ` +
                         `I can't believe you're asking this.`)
  }
}
```
