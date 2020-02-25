import EventEmitter from 'events'
import createDebug from 'debug'
import command from './command'

const debug = createDebug('munar:plugin')

export default class Plugin extends EventEmitter {
  commands = []

  static defaultOptions = {}

  constructor (bot, options) {
    super()

    this.bot = bot
    this.options = {
      ...this.constructor.defaultOptions,
      ...options
    }

    if (this[command.symbol]) {
      this.commands = this[command.symbol].slice()
    }

    debug('init', this.constructor.name)
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
    // Compat
    this.init && this.init()
  }

  disable () {
    // Compat
    this.destroy && this.destroy()
  }

  enabled () {
    return this.bot.plugins.enabled(this)
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
