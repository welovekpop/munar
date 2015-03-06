const assign = require('object-assign')
const find = require('array-find')

export default class Module {

  constructor(sekshi, options = {}) {
    this.sekshi = sekshi
    this.options = assign({}, this.defaultOptions(), options)
    this.permissions = {}
    this.ninjaVanish = []

    this._enabled = false
  }

  defaultOptions() {
    return {}
  }

  init() {
  }
  destroy() {
  }

  enable() {
    if (!this.enabled()) {
      this._enabled = true
      this.init()
    }
  }
  disable() {
    if (this.enabled()) {
      this.destroy()
      this._enabled = false
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
    }
  }
  getOptions() {
    return this.options
  }

}