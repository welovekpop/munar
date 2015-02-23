const assign = require('object-assign')

export default class Module {

  constructor(sekshi, options = {}) {
    this.sekshi = sekshi
    this.options = assign({}, this.defaultOptions(), options)
    this.permissions = {}

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

}