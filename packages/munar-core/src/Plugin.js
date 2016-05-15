import EventEmitter from 'events'
import command from './command'

const debug = require('debug')('munar:plugin')

export default class Plugin extends EventEmitter {
  _enabled = false
  commands = []

  static defaultOptions = {}

  constructor (bot, options) {
    super()

    this.bot = bot
    this.options = {
      ...this.constructor.defaultOptions,
      ...options
    }

    debug('init', this.constructor.name)
  }

  init () {
  }
  destroy () {
  }

  models (models) {
    Object.keys(models).forEach((name) => {
      this.model(name, models[name])
    })
    return this
  }
  model (name, schema) {
    if (!schema) {
      return this.bot.model(name)
    }
    this.bot.model(name, schema, this)
    return this
  }

  adapter (name) {
    return this.bot.getAdapter(name)
  }

  enable () {
    if (!this.enabled()) {
      debug('enable', this.constructor.name)

      this._enabled = true

      if (this[command.symbol]) {
        this.commands = this[command.symbol].slice()
      }

      this.emit('enable')
      this.init()
    }
  }
  disable () {
    if (this.enabled()) {
      debug('disable', this.constructor.name)

      this.destroy()
      this._enabled = false
      this.commands = []
      this.emit('disable')
    }
  }
  enabled () {
    return this._enabled
  }

  addCommand (name, opts, cb = null) {
    if (cb === null) {
      [ opts, cb ] = [ {}, opts ]
    }
    this.commands.push({
      ...command.defaults,
      ...opts,
      names: [ name ],
      callback: cb
    })
    return this
  }

  removeCommand (name) {
    this.commands = this.commands.filter((com) => {
      let i = com.names.indexOf(name)
      if (i !== -1) {
        com.names.splice(i, 1)
      }
      // keep if there are still names that trigger this command
      return com.names.length > 0
    })
  }

  _getOptionName (name) {
    const names = Object.keys(this.options)
    const lname = name.toLowerCase()
    return names.find((n) => n.toLowerCase() === lname) || name
  }

  getOption (name) {
    return this.options[this._getOptionName(name)]
  }

  setOption (name, value) {
    const oname = this._getOptionName(name)
    this.options[oname] = value
  }

  getOptions () {
    return this.options
  }
}
