const find = require('array-find')
const findIndex = require('array-findindex')
const includes = require('array-includes')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const readdir = Promise.promisify(require('recursive-readdir'))
const path = require('path')
const { EventEmitter } = require('events')
const debug = require('debug')('sekshi:modulemanager')

const moduleRx = /\.module\.js$/

export default class ModuleManager extends EventEmitter {

  constructor(sekshi, dir) {
    super()
    this.moduleNames = []
    this.moduleNameMap = {}
    this.modules = []
    this.dir = dir
    this.sekshi = sekshi
  }

  // fix case in module names
  getModuleName(name) {
    let lname = name.toLowerCase()
    return this.moduleNameMap[lname]
  }

  getModulePath(name) {
    return path.join(this.dir, `${this.getModuleName(name)}.module.js`)
  }

  getConfigFile(name) {
    return path.join(this.sekshi.getConfigDir(), `${name.toLowerCase()}.json`)
  }

  known() {
    return this.moduleNames
  }

  loaded() {
    return this.modules.map(mod => mod.name)
  }

  update() {
    return readdir(this.dir)
      .filter(name => moduleRx.test(name))
      .map(name => path.relative(this.dir, name))
      .map(name => name.replace(moduleRx, ''))
      .tap(names => this._setModuleNames(names))
  }

  register(name, instance) {
    this.modules.push({
      name, instance
    })

    this.emit('register', instance, name)
  }

  unregister(rawName) {
    let lname = rawName.toLowerCase()
    let i = findIndex(this.modules, mod => mod.name.toLowerCase() === lname)
    if (i !== -1) {
      let mod = this.modules[i]
      this.modules.splice(i, 1)

      this.emit('unregister', mod.instance, mod.name)

      return true
    }
    return false
  }

  get(rawName) {
    let moduleName = this.getModuleName(rawName)
    let mod = find(this.modules, mod => mod.name == moduleName)
    return mod ? mod.instance : null
  }

  load(rawName) {
    let moduleName = this.getModuleName(rawName)
    if (!moduleName) {
      throw new Error(`Module "${moduleName}" not found`)
    }

    let mod = this.get(moduleName)
    if (mod) return mod

    let modulePath = this.getModulePath(moduleName)
    const ModuleClass = require(modulePath)
    this.register(moduleName, new ModuleClass(this.sekshi, this.getConfigFile(moduleName)))
    mod = this.get(moduleName)

    // enable system modules by default
    if (moduleName === 'System' || mod.getOption('$enabled')) {
      mod.enable({ silent: true })
    }

    this.emit('load', mod, moduleName)

    return mod
  }

  unload(name) {
    let mod = this.get(name)
    if (mod) {
      mod.saveOptions()
      mod.disable({ silent: true })
      delete require.cache[path.resolve(this.getModulePath(name))]
      this.unregister(name)

      this.emit('unload', mod, this.getModuleName(name))
    }

    return mod
  }

  reload(name) {
    this.unload(name)
    return this.load(name)
  }

  _setModuleNames(names) {
    debug('names', ...names)
    let previous = this.moduleNames
    previous.forEach(name => {
      if (!includes(names, name)) {
        this.emit('lost', name)
      }
    })
    names.forEach(name => {
      if (!includes(previous, name)) {
        this.emit('discovered', name)
      }
    })
    this.moduleNames = names
    this.moduleNameMap = names.reduce((map, name) => {
      map[name.toLowerCase()] = name
      return map
    }, {})
  }

}
