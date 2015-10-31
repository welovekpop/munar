const { EventEmitter } = require('events')
const path = require('path')
const fs = require('fs')
const debug = require('debug')('sekshi:sekshi')
const logChat = require('debug')('sekshi:chat')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const find = require('array-find')
const includes = require('array-includes')
const mkdirp = require('mkdirp')
const User = require('./models/User')
const commandsSymbol = require('./command').symbol
const ModuleManager = require('./ModuleManager')
const quote = require('regexp-quote')

mongoose.Promise = Promise

export default class Sekshi extends EventEmitter {
  constructor(args) {
    super()
    this.options = args
    this.db = mongoose.connect(args.mongo)

    this.modules = new ModuleManager(this, path.join(__dirname, 'modules'))
    this.adapters = []
    this.delimiter = args.delimiter || '!'

    this._configDir = path.join(__dirname, '../.config')

    this.onMessage = ::this.onMessage
  }

  adapter(Adapter, options) {
    const adapter = new Adapter(this, options)
    this.adapters.push(adapter)
    adapter.on('message', this.onMessage)
  }

  start(creds, cb) {
    this.adapters.forEach(adapter => adapter.enable())
    this.loadModules()
    mkdirp(this._configDir, (e) => {
      if (cb) cb(e || null)
    })

    // the event is fired on nextTick so modules can simply listen for "moduleloaded"
    // and get events for *all* the modules when loadModules() is called, even for those
    // that register earlier
    this.modules.on('load', (mod, name) => {
      setImmediate(() => { this.emit('moduleloaded', mod, name) })
    })
    this.modules.on('unload', (mod, name) => {
      setImmediate(() => { this.emit('moduleunloaded', mod, name) })
    })
  }

  stop(cb) {
    this.unloadModules()
    // should *probably* also wait for this before callback-ing
    mongoose.disconnect()

    this.once(this.LOGOUT_SUCCESS, () => {
      this.removeAllListeners()
      if (cb) {
        cb()
      }
    })
    this.once(this.LOGOUT_ERROR, e => {
      // TODO figure out something useful to do here
      this.removeAllListeners()
      if (cb) {
        cb(e)
      }
    })
  }

  // Find a user model or default to something.
  // Useful for commands that can optionally take a target user.
  findUser(name, _default = null) {
    if (!name) {
      return _default
        ? Promise.resolve(_default)
        : Promise.reject(new Error('No user given'))
    }

    let promise
    let user = this.getUserByName(name)
    if (user) {
      promise = User.findById(user.id)
    }
    else {
      name = name.replace(/^@/, '')
      let rx = new RegExp(`^${quote(name)}$`, 'i')
      promise = User.findOne({ username: rx })
    }
    return promise.then(user => {
      return user || Promise.reject(new Error('User not found'))
    })
  }

  onMessage(message) {
    if (message.text && message.text.startsWith(this.delimiter)) {
      this.executeMessage(message)
        .catch(e => message.reply(`Error: ${e.message}`))
    }
  }

  executeMessage(message) {
    const { source } = message

    let args = this.parseArguments(message.text)
    let commandName = args.shift().replace(this.delimiter, '').toLowerCase()

    let promise = Promise.resolve()
    this.modules.loaded().forEach(name => {
      let mod = this.modules.get(name)
      if (!mod || !mod.enabled() || !Array.isArray(mod.commands)) return

      let command = find(mod.commands, com => includes(com.names, commandName))
      if (!command) return

      if (command.ninjaVanish && message) {
        message.delete()
      }
      if (source.canExecute(message)) {
        if (command.method) {
          mod[command.method](message, ...args)
        }
        else {
          command.callback.call(mod, message, ...args)
        }
      }
      else {
        promise = Promise.reject(new Error('You cannot use this command.'))
      }
    })
    return promise
  }

  // Parses space-separated chat command arguments.
  // single words become single arguments.
  //    word → [ 'word ']
  // strings surrounded by double quotes become single arguments.
  //    "quoted words" word → [ 'quoted words', 'word' ]
  // strings prefixed with "@" are matched to the online user list.
  // if any online user's name matches the string, it will be passed instead.
  // this is so that you don't need quotes around usernames with spaces.
  //    @Online User parameter @Offline User → [ 'Online User', 'parameter', '@Offline', 'User' ]
  //
  // feature-bugs:
  // if you forget to close a quoted string it will go until the end of the line (might be unexpected)
  // if you forget to add a space after a quoted string, the rest will be read as a separate parameter
  parseArguments(str = '') {
    let args = []
    let i = 0
    let chunk

    let usernames = str.indexOf('@') !== -1 // might contain a username
      ? [ this.getSelf(), ...this.getUsers() ]
          .map(u => u.username)
          // longest usernames first
          .sort((a, b) => a.length > b.length ? -1 : 1)
      : []

    while (chunk = str.slice(i)) {
      // separator
      if (chunk.charAt(0) === ' ') {
        i++
        continue
      }
      // quoted string
      else if (chunk.charAt(0) === '"') {
        let end = chunk.indexOf('"', 1)
        // end of param string
        if (end === -1) {
          args.push(chunk.slice(1))
          break
        }
        args.push(chunk.slice(1, end))
        i += end + 1
        continue
      }
      // possible username
      else if (chunk.charAt(0) === '@') {
        let username = find(usernames,
                            name => chunk.slice(1, name.length + 1).toLowerCase() === name.toLowerCase())
        if (username) {
          args.push(username)
          i += `@${username}`.length
          continue
        }
      }
      // single parameter word
      let end = chunk.indexOf(' ')
      // end of param string
      if (end === -1) {
        args.push(chunk)
        break
      }
      args.push(chunk.slice(0, end))
      i += end + 1
      continue
    }

    return args
  }

  getModule(name) {
    return this.modules.get(name)
  }

  loadModules() {
    debug('load all')
    this.modules.update()
      .each(name => this.modules.load(name))
  }

  unloadModules() {
    debug('unload all')
    this.modules.loaded()
      .forEach(name => this.modules.unload(name))
  }

  getConfigDir() {
    return this._configDir
  }
}
