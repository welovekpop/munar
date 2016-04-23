import includes from 'array-includes'
import Promise from 'bluebird'
import path from 'path'
import { EventEmitter } from 'events'

const readdir = Promise.promisify(require('recursive-readdir'))
const debug = require('debug')('sekshi:pluginmanager')

const pluginRx = /\.module\.js$/

export default class PluginManager extends EventEmitter {
  pluginNames = []
  pluginNameMap = {}
  plugins = []

  constructor (bot, dir) {
    super()
    this.dir = dir
    this.bot = bot
  }

  // fix case in plugin names
  getPluginName (name) {
    let lname = name.toLowerCase()
    return this.pluginNameMap[lname]
  }

  getPluginPath (name) {
    return path.join(this.dir, `${this.getPluginName(name)}.module.js`)
  }

  getConfigFile (name) {
    return path.join(this.bot.getConfigDir(), `${name.toLowerCase()}.json`)
  }

  known () {
    return this.pluginNames
  }

  loaded () {
    return this.plugins.map((plugin) => plugin.name)
  }

  update () {
    return readdir(this.dir)
      .filter((name) => pluginRx.test(name))
      .map((name) => path.relative(this.dir, name))
      .map((name) => name.replace(pluginRx, ''))
      .tap((names) => this._setPluginNames(names))
  }

  register (name, instance) {
    this.plugins.push({
      name, instance
    })

    this.emit('register', instance, name)
  }

  unregister (rawName) {
    let lname = rawName.toLowerCase()
    let i = this.plugins.findIndex((plugin) => plugin.name.toLowerCase() === lname)
    if (i !== -1) {
      let plugin = this.plugins[i]
      this.plugins.splice(i, 1)

      this.emit('unregister', plugin.instance, plugin.name)

      return true
    }
    return false
  }

  get (rawName) {
    let pluginName = this.getPluginName(rawName)
    let plugin = this.plugins.find((plugin) => plugin.name === pluginName)
    return plugin ? plugin.instance : null
  }

  load (rawName) {
    let pluginName = this.getPluginName(rawName)
    if (!pluginName) {
      throw new Error(`Plugin "${pluginName}" not found`)
    }

    let plugin = this.get(pluginName)
    if (plugin) return plugin

    let pluginPath = this.getPluginPath(pluginName)
    const PluginClass = require(pluginPath).default
    this.register(pluginName, new PluginClass(this.bot, this.getConfigFile(pluginName)))
    plugin = this.get(pluginName)

    // enable system plugins by default
    if (pluginName === 'System' || plugin.getOption('$enabled')) {
      plugin.enable({ silent: true })
    }

    this.emit('load', plugin, pluginName)

    return plugin
  }

  unload (name) {
    let plugin = this.get(name)
    if (plugin) {
      plugin.saveOptions()
      plugin.disable({ silent: true })
      delete require.cache[path.resolve(this.getPluginPath(name))]
      this.unregister(name)

      this.emit('unload', plugin, this.getPluginName(name))
    }

    return plugin
  }

  reload (name) {
    this.unload(name)
    return this.load(name)
  }

  _setPluginNames (names) {
    debug('names', ...names)
    let previous = this.pluginNames
    previous.forEach((name) => {
      if (!includes(names, name)) {
        this.emit('lost', name)
      }
    })
    names.forEach((name) => {
      if (!includes(previous, name)) {
        this.emit('discovered', name)
      }
    })
    this.pluginNames = names
    this.pluginNameMap = names.reduce((map, name) => {
      map[name.toLowerCase()] = name
      return map
    }, {})
  }
}
