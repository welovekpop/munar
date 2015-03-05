const assign = require('object-assign')

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

  getOption(name) {
    return this.options[name]
  }
  setOption(name, value) {
    if (name in this.options) {
      this.options[name] = value
    }
  }
  getOptions() {
    return this.options
  }

}