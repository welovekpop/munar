import includes from 'array-includes'
import * as path from 'path'
import EventEmitter from 'events'

const debug = require('debug')('munar:pluginmanager')

export default class PluginManager extends EventEmitter {
  plugins = []

  constructor (bot, options = {}) {
    super()

    if (typeof options === 'string') {
      options = { dir: options }
    }

    this.options = options
    this.bot = bot
  }

  getConfigFile (name) {
    return path.join(this.bot.getConfigDir(), `${name.toLowerCase()}.json`)
  }

  known () {
    return this.plugins.map((plugin) => plugin.name)
  }

  loaded () {
    return this.plugins
      .filter((plugin) => !!plugin.instance)
      .map((plugin) => plugin.name)
  }

  async updateLocalPlugins (dir) {
    return []
  }

  async update () {
    let plugins = []
    if (this.options.dir) {
      const localPlugins = await this.updateLocalPlugins(this.options.dir)
      plugins = [ ...plugins, ...localPlugins ]
    }

    for (const { name, path } of plugins) {
      if (!this.plugins.some((plugin) => plugin.name === name)) {
        this.register(name, path)
      }
    }

    const pluginNames = plugins.map((plugin) => plugin.name)
    for (const plugin of this.plugins) {
      if (!includes(pluginNames, plugin.name)) {
        this.unregister(plugin.name)
      }
    }

    return this.known()
  }

  register (name, path) {
    this.plugins.push({
      name, path
    })

    this.emit('discovered', name, path)
  }

  unregister (rawName) {
    let lname = rawName.toLowerCase()
    let i = this.plugins.findIndex((plugin) => plugin.name.toLowerCase() === lname)
    if (i !== -1) {
      let plugin = this.plugins[i]
      this.plugins.splice(i, 1)

      this.emit('lost', plugin.instance, plugin.name)

      return true
    }
    return false
  }

  getMeta (pluginName) {
    return this.plugins.find(
      (plugin) => plugin.name.toLowerCase() === pluginName.toLowerCase()
    )
  }

  get (pluginName) {
    const meta = this.getMeta(pluginName)
    return meta ? meta.instance : null
  }

  load (pluginName) {
    const meta = this.getMeta(pluginName)

    if (meta.instance) return meta.instance

    debug('load', meta.name)

    const m = require(meta.path)
    const PluginClass = m.default || m
    const plugin = new PluginClass(this.bot, this.getConfigFile(meta.name))

    meta.instance = plugin

    // enable system plugins by default
    if (meta.name === 'System' || plugin.getOption('$enabled')) {
      plugin.enable({ silent: true })
    }

    this.emit('load', plugin, meta.name)

    return plugin
  }

  unload (pluginName) {
    const meta = this.getMeta(pluginName)
    if (meta) {
      debug('unload', meta.name)

      meta.instance.saveOptions()
      meta.instance.disable({ silent: true })
      delete require.cache[meta.path]
      this.unregister(meta.name)

      this.emit('unload', meta.instance, meta.name)
      return meta.instance
    }

    return null
  }

  reload (name) {
    this.unload(name)
    return this.load(name)
  }
}
