import EventEmitter from 'events'
import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'
import Promise from 'bluebird'
import find from 'array-find'
import includes from 'array-includes'
import mkdirp from 'mkdirp'
import User from './models/User'
import { symbol as commandsSymbol } from './command'
import ModuleManager from './ModuleManager'
import quote from 'regexp-quote'
import Ultron from 'ultron'

const debug = require('debug')('sekshi:sekshi')
const logChat = require('debug')('sekshi:chat')

mongoose.Promise = Promise

const attachedAdapterEventsSymbol = Symbol('attached adapter events')

export default class Sekshi extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
    this.db = mongoose.connect(options.mongo)

    this.modules = new ModuleManager(this, path.join(__dirname, 'modules'))
    this.adapters = {}
    this.trigger = options.trigger || '!'

    this._configDir = path.join(__dirname, '../.config')
  }

  adapter(SourceAdapter, options) {
    const name = SourceAdapter.adapterName
    const adapter = new SourceAdapter(this, options)
    this.adapters[name] = adapter
  }

  getAdapter (name) {
    return this.adapters[name]
  }

  async start(creds, cb) {
    await Promise.all(
      Object.keys(this.adapters).map((adapterName) => {
        const adapter = this.adapters[adapterName]
        return adapter.connect()
      })
    )

    Object.keys(this.adapters).map((adapterName) => {
      this.attachAdapter(this.adapters[adapterName])
    })

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
    Object.keys(this.adapters).map((adapterName) => {
      const adapter = this.adapters[adapterName]
      this.detachAdapter(adapter)
      return adapter.disconnect()
    })
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

  attachAdapter (adapter) {
    const events = new Ultron(adapter)
    events.on('message', this.onMessage)
    events.on('user:join', (user) => {
      this.emit('user:join', user)
    })
    events.on('user:leave', (user) => {
      this.emit('user:leave', user)
    })
    adapter[attachedAdapterEventsSymbol] = events
  }

  detachAdapter (adapter) {
    if (attachedAdapterEventsSymbol in adapter) {
      adapter[attachedAdapterEventsSymbol].remove()
      adapter[attachedAdapterEventsSymbol] = null
    }
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

  onMessage = (message) => {
    this.emit('message', message)
    if (message.text && message.text.startsWith(this.trigger)) {
      this.executeMessage(message)
        .catch(e => message.reply(`Error: ${e.message}`))
    }
  }

  executeMessage(message) {
    const { source } = message

    let args = this.parseArguments(message)
    let commandName = args.shift().replace(this.trigger, '').toLowerCase()

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
  parseArguments(message) {
    let args = []
    let i = 0
    let chunk
    const str = message.text || ''
    const source = message.source

    let usernames = str.indexOf('@') !== -1 // might contain a username
      ? source.getUsers().map((user) => user.username)
          // longest usernames first
          .sort((a, b) => a.length > b.length ? -1 : 1)
      : []

    while (chunk = str.slice(i)) {
      // separator
      if (chunk.charAt(0) === ' ') {
        i++
        continue
      } else if (chunk.charAt(0) === '"') {
        // quoted string
        let end = chunk.indexOf('"', 1)
        // end of param string
        if (end === -1) {
          args.push(chunk.slice(1))
          break
        }
        args.push(chunk.slice(1, end))
        i += end + 1
        continue
      } else if (chunk.charAt(0) === '@') {
        // possible username
        let username = usernames.find(
          (name) => chunk.slice(1, name.length + 1).toLowerCase() === name.toLowerCase()
        )
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
