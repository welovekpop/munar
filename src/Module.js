const assign = require('object-assign')
const find = require('array-find')
const { EventEmitter } = require('events')
const fs = require('fs')
const debug = require('debug')('sekshi:module')

export default class Module extends EventEmitter {

  constructor(sekshi, optionsFile) {
    super()

    this._enabled = false
    this._optionsFile = optionsFile

    this.sekshi = sekshi
    this.options = assign({}, this.defaultOptions(), this.loadOptions())
    this.permissions = {}
    this.ninjaVanish = []
  }

  defaultOptions() {
    return {}
  }

  init() {
  }
  destroy() {
  }

  enable(opts = {}) {
    if (!this.enabled()) {
      this._enabled = true
      // don't save immediately on boot
      if (!opts.silent) {
        this.saveOptions()
      }
      this.init()
    }
  }
  disable() {
    if (this.enabled()) {
      this.destroy()
      this._enabled = false
      this.saveOptions()
    }
  }
  enabled() {
    return this._enabled
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
    options = assign({}, options, { $enabled: this.enabled() })
    fs.writeFileSync(this._optionsFile, JSON.stringify(options, null, 2), 'utf8')
  }

}
