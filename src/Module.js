const assign = require('object-assign')

export default class Module {

  constructor(sekshi, options = {}) {
    if (typeof this.name !== 'string') {
      throw new Error('Modules have to have a name')
    }

    this.sekshi = sekshi
    this.options = assign({}, this.defaultOptions(), options)
    this.permissions = {}

    this._enabled = true
  }

  defaultOptions() {
    return {}
  }

  destroy() {
  }

  enable() {
    this._enabled = true
  }
  disable() {
    this.destroy()
    this._enabled = false
  }
  enabled() {
    return this._enabled
  }

}