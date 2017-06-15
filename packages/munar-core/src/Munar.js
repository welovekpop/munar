import EventEmitter from 'events'

import includes from 'array-includes'
import mongoose from 'mongoose'
import { createSchema } from 'mongoose-model-decorators'
import Promise from 'bluebird'

import PluginManager from './PluginManager'
import argumentParser from './argumentParser'
import { UserModel, ChatMessageModel } from './models'

const debug = require('debug')('munar:core')

mongoose.Promise = Promise

const ownerSymbol = Symbol('owner')

export default class Munar extends EventEmitter {
  _adapters = {}

  static defaultOptions = {
    mongo: 'mongodb://localhost:27017/munar',
    trigger: '!'
  }

  constructor (options = {}) {
    super()
    this.options = {
      ...this.constructor.defaultOptions,
      ...options
    }
    this.db = mongoose.connect(this.options.mongo)

    this.plugins = new PluginManager(this)

    this.model('User', UserModel, this)
    this.model('ChatMessage', ChatMessageModel, this)
  }

  get adapters () {
    return Object.keys(this._adapters).map((adapterName) => {
      return this._adapters[adapterName]
    })
  }

  adapter (SourceAdapter, options) {
    const adapter = new SourceAdapter(this, options)
    const name = adapter.getAdapterName()
    this._adapters[name] = adapter
  }

  getAdapter (name) {
    return this._adapters[name]
  }

  getChannel (name) {
    const split = name.indexOf(':')
    const adapterName = split > -1 ? name.slice(0, split) : name
    const channel = split > -1 ? name.slice(split + 1) : 'main'
    const adapter = this.getAdapter(adapterName)
    return adapter.getChannelByName
      ? adapter.getChannelByName(channel)
      : adapter.getChannel(channel)
  }

  use (plugin, options = {}) {
    if (typeof plugin === 'string') {
      let path = require.resolve(`munar-plugin-${plugin}`)
      this.plugins.register(plugin, path)
      if (options.enable) {
        this.plugins.load(plugin, options)
      }
    } else {
      throw new TypeError('¯\\_(ツ)_/¯')
    }
    return this
  }

  model (name, schema, owner) {
    if (arguments.length === 1) {
      return mongoose.model(name)
    }
    let model
    if (typeof schema === 'function') {
      const SchemaClass = createSchema()(schema)
      schema = new SchemaClass()
    }
    model = mongoose.model(name, schema)
    model[ownerSymbol] = owner
    return this
  }

  async start (creds, cb) {
    await Promise.all(
      this.adapters.map((adapter) => adapter.connect())
    )

    this.loadPlugins()
  }

  async stop () {
    this.unloadPlugins()

    await Promise.all(
      this.adapters.map((adapter) => adapter.disconnect())
    )

    // should *probably* also wait for this before callback-ing
    await mongoose.disconnect()
  }

  receive (adapter, event, args) {
    if (event === 'message') {
      this.onMessage(...args)
    } else {
      this.emit(event, adapter, ...args)
    }
  }

  onMessage = (message) => {
    this.emit('message', message)
    if (message.text && message.text.startsWith(this.options.trigger)) {
      this.executeMessage(message)
        .catch((e) => message.reply(`Error: ${e.message}`))
    }
  }

  executeMessage (message) {
    const { source } = message

    let args = this.parseArguments(message)
    let commandName = args.shift().replace(this.options.trigger, '').toLowerCase()

    async function tryCommand (pluginName) {
      const plugin = this.plugins.get(pluginName)
      if (!plugin || !plugin.enabled() || !Array.isArray(plugin.commands)) {
        return
      }

      const command = plugin.commands.find(
        (com) => includes(com.names, commandName)
      )
      if (!command) return

      if (command.arguments) {
        args = await argumentParser.parse(args, command.arguments)
      }

      if (command.ninjaVanish && message) {
        message.delete()
      }

      if (source.canExecute(message, command)) {
        if (command.method) {
          await plugin[command.method](message, ...args)
        } else {
          await command.callback.call(plugin, message, ...args)
        }
      } else {
        throw new Error('You cannot use this command.')
      }
    }

    return Promise.all(
      this.plugins.loaded().map(tryCommand, this)
    )
  }

  /**
   * Parses space-separated chat command arguments.
   * single words become single arguments.
   *    word → [ 'word ']
   * strings surrounded by double quotes become single arguments.
   *    "quoted words" word → [ 'quoted words', 'word' ]
   * strings prefixed with "@" are matched to the online user list.
   * if any online user's name matches the string, it will be passed instead.
   * this is so that you don't need quotes around usernames with spaces.
   *    @Online User parameter @Offline User → [ 'Online User', 'parameter', '@Offline', 'User' ]
   *
   * feature-bugs:
   * if you forget to close a quoted string it will go until the end of the line (might be unexpected)
   * if you forget to add a space after a quoted string, the rest will be read as a separate parameter
   */
  parseArguments (message) {
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

    while ((chunk = str.slice(i))) {
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

  getPlugin (name) {
    return this.plugins.get(name)
  }

  /**
   * Find a user from any adapter, defaulting to a given one. Useful when
   * commands should act on a target user, on any adapter, eg:
   *
   *    !karma @someone - karma of @someone on the current adapter
   *    !karma slack:@someone - karma of @someone on Slack
   */
  findUser (username, { adapter = null } = {}) {
    // A name like "slack:jenn"
    const parts = username.split(':')
    if (parts.length > 1 && this.getAdapter(parts[0])) {
      username = parts.slice(1).join(':')
      adapter = this.getAdapter(parts[0])
    }

    if (username[0] === '@') {
      username = username.slice(1)
    }

    return this.model('User').findByUsername(adapter, username)
  }

  loadPlugins () {
    debug('load all', this.plugins.known())
    this.plugins.known()
      .forEach((name) => this.plugins.load(name))
  }

  unloadPlugins () {
    debug('unload all')
    this.plugins.loaded()
      .forEach((name) => this.plugins.unload(name))
  }
}
