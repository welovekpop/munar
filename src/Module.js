import find from 'array-find'
import includes from 'array-includes'
import mkdirp from 'mkdirp'
import { EventEmitter } from 'events'
import fs from 'fs'
import { dirname } from 'path'
import command from './command'

const debug = require('debug')('sekshi:module')

export default class Module extends EventEmitter {
  constructor(bot, optionsFile) {
    super()

    this._enabled = false
    this._optionsFile = optionsFile
    this.commands = []

    this.bot = bot
    this.sekshi = bot
    this.options = { ...this.defaultOptions(), ...this.loadOptions() }

    debug('init', this.constructor.name, optionsFile)
  }

  defaultOptions() {
    return {}
  }

  init() {
  }
  destroy() {
  }

  adapter (name) {
    return this.bot.getAdapter(name)
  }

  enable(opts = {}) {
    if (!this.enabled()) {
      this._enabled = true
      // don't save immediately on boot
      if (!opts.silent) {
        this.saveOptions()
      }

      if (this[command.symbol]) {
        this.commands = this[command.symbol].slice()
      }

      this.init()
    }
  }
  disable(opts = {}) {
    if (this.enabled()) {
      this.destroy()
      this._enabled = false
      this.commands = []
      if (!opts.silent) {
        this.saveOptions()
      }
    }
  }
  enabled() {
    return this._enabled
  }

  addCommand(name, opts, cb = null) {
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

  removeCommand(name) {
    this.commands = this.commands.filter(com => {
      let i = com.names.indexOf(name)
      if (i !== -1) {
        com.names.splice(i, 1)
      }
      // keep if there are still names that trigger this command
      return com.names.length > 0
    })
  }

  _getOptionName(name) {
    const names = Object.keys(this.options)
    const lname = name.toLowerCase()
    return find(names, n => n.toLowerCase() == lname) || name
  }

  getOption(name) {
    return this.options[this._getOptionName(name)]
  }

  setOption(name, value) {
    const oname = this._getOptionName(name)
    if (oname in this.options) {
      this.options[oname] = value
      this.saveOptions()
    }
  }

  getOptions() {
    return this.options
  }

  loadOptions() {
    try {
      debug('loading options', this._optionsFile)
      return JSON.parse(fs.readFileSync(this._optionsFile, 'utf8'))
    }
    catch (e) {
      return {}
    }
  }

  saveOptions(options = this.getOptions()) {
    debug('saving options', this._optionsFile)
    options = { ...options, $enabled: this.enabled() }
    mkdirp.sync(dirname(this._optionsFile))
    fs.writeFileSync(this._optionsFile, JSON.stringify(options, null, 2), 'utf8')
  }
}
