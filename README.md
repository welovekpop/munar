# SekshiBot
Plug.dj room bot for WE ♥ KPOP

## Installation

```
git clone https://github.com/welovekpop/SekshiBot
cd SekshiBot
npm install
```

## Configuration

1. Put your room name in the "room" property in `config.json`
1. Put your bot account credentials in a repo root-level file `creds.json` (next to `config.json`), like this:

```json
{ "email": "my-bot-account@plug.dj", "password": "t0pS3cr3tP4ssw0rd" }
```

Other config options are not (yet) set in the `config.json` file, but hardcoded in the module files. Please don't hurt me.

## Running

Sekshi uses some fancy-ES6-of-the-future, so you need to get that transpiled into poor-lady's-JS-of-today (aka ES5) first, using [Babel](https://babeljs.io). It's actually pretty damn easy, especially with these commands:

* Just transpiling: `npm run-script babel` Outputs poor-lady's-JS-of-today in `lib/`.
* Running transpiled code: `npm run-script start` (So you need to run ^ first for this)
* Running the bot while transpiling on the fly: `npm run-script babel-start`

The last one is funnest for testing. So, that.

Also, if you want to test things, you can enable debug information by setting the `DEBUG` environment variable:
```
DEBUG=* npm run-script babel-start # outputs debug information from Sekshi and her dependencies
DEBUG=sekshi:* npm run-script babel-start # only outputs debug information from Sekshi
```

## Making modules

Sekshi autoloads modules from the `src/modules` directory. Just make sure your file name ends in `.module.js`, and that your module class inherits from `src/Module`! Modules should generally look like:

```javascript
// src/modules/MyModule.module.js
const debug = require('debug')('sekshi:my-module') // replace that last bit with your module name!
const SekshiModule = require('../Module')
// <your requires here>

export default class MyModule extends SekshiModule {
  constructor(sekshi, options) {
    // meta
    this.name = 'My Module'
    this.author = 'Me!'
    this.version = '0.1.0'
    this.description = 'This is a module!'

    // initialise the module AFTER you've set meta data!
    super(sekshi, options)

    // commands! For user roles, see the Sooyou/plugged documentation
    this.permissions = {
      who: sekshi.USERROLE.NONE, // Anyone can use this command!
      why: sekshi.USERROLE.BOUNCER // Only bouncers and up can use this command!
    }

    // your own initialisation! Maybe you want to add some event handlers, or start a timer…
  }

  destroy() {
    // detach any event listeners here, if you have them
  }

  // the commands defined in `this.permissions` map straight to these methods:
  who(sender) {
    this.sekshi.sendChat(`@${sender.username} It's Meeee! With my very own module!`)
  }

  why(sender) {
    this.sekshi.sendChat(`@${sender.username} Omg. I can't believe you're asking this.`)
  }
}
```