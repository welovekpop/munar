import { Plugin, command, permissions } from 'munar-core'
import Ultron from 'ultron'

const debug = require('debug')('munar:config')

const configCommands = [ 'set', 'get', 'add', 'remove' ]

class PluginConfigModel {
  static collection = 'plugin_config'
  static timestamps = true

  static schema = {
    _id: { type: String, index: true, unique: true },
    enabled: { type: Boolean, default: false },
    options: {}
  }
}

export default class Config extends Plugin {
  static description = 'Keeps plugin configuration.'

  events = []

  constructor (bot, options) {
    super(bot, options)

    this.models({
      PluginConfig: PluginConfigModel
    })
  }

  enable () {
    const events = new Ultron(this.bot.plugins)
    events.on('load', this.onPluginLoad)

    this.events.push(events)
  }

  disable () {
    this.events.forEach((events) => events.remove())
    this.events = []
  }

  async set (message, ns, option, value) {
    const plugin = this.bot.getPlugin(ns)
    if (/^[0-9]+$/.test(value)) {
      value = parseInt(value, 10)
    }
    if (/^true|false$/.test(value)) {
      value = value === 'true'
    }
    debug('value', typeof value, value)
    plugin.setOption(option, value)
    await this.save(ns, plugin.getOptions())
    message.reply(`"${ns}.${option}" set to ${value}`)
  }

  async get (message, ns, option) {
    let plugin = this.bot.getPlugin(ns)
    if (option) {
      message.reply(`"${ns}.${option}": ${plugin.getOption(option)}`)
    } else {
      const options = plugin.getOptions()
      debug('all options', options)
      for (const option of Object.keys(options)) {
        message.reply(`${ns}.${option}: ${options[option]}`)
      }
    }
  }

  async add (message, ns, option, ...values) {
    const plugin = this.bot.getPlugin(ns)
    let arr = plugin.getOption(option)
    if (arr == null) {
      arr = values
    } else if (Array.isArray(arr)) {
      arr = arr.concat(values)
    } else {
      throw new TypeError(`"${ns}.${option}" is not a list.`)
      return
    }
    plugin.setOption(option, arr)
    await this.save(ns, plugin.getOptions())
    message.reply(`added values to "${ns}.${option}".`)
  }
  async remove (message, ns, option, ...values) {
    const plugin = this.bot.getPlugin(ns)
    let arr = plugin.getOption(option)
    if (Array.isArray(arr)) {
      arr = arr.filter((val) => values.indexOf(val) === -1)
    } else {
      throw new TypeError(`"${ns}.${option}" is not a list.`)
    }
    plugin.setOption(option, arr)
    await this.save(ns, plugin.getOptions())
    message.reply(`removed values from "${ns}.${option}".`)
  }

  @command('config', 'cf', { role: permissions.MANAGER })
  async config (message, command, ns, ...args) {
    if (configCommands.indexOf(command) === -1) {
      throw new Error(`"${command}" is not a command.`)
    }
    if (!ns) {
      throw new Error('You should provide a plugin to configure.')
    }

    const plugin = this.bot.getPlugin(ns)
    if (!plugin) {
      throw new Error(`Could not find plugin "${ns}".`)
    }

    await this[command](message, ns, ...args)
  }

  onPluginLoad = async (instance, name) => {
    const { options, enabled } = await this.load(name)
    Object.keys(options).forEach((optionName) => {
      instance.setOption(optionName, options[optionName])
    })

    if (enabled && !instance.enabled()) {
      instance.enable()
    } else if (!enabled && instance.enabled()) {
      instance.disable()
    }

    const onChange = () => this.onChange(name, instance)

    this.events.push(
      new Ultron(instance)
        .on('option', onChange)
        .on('enable', onChange)
        .on('disable', onChange)
    )
    debug('attached load handlers', name)
  }

  async onChange (name, instance) {
    const PluginConfig = this.model('PluginConfig')

    const enabled = instance.enabled()
    const options = instance.getOptions()

    debug('save', name, enabled ? 'enabled' : 'disabled', options)
    await PluginConfig.update(
      { _id: name },
      {
        _id: name,
        enabled,
        options
      },
      { upsert: true }
    )
  }

  async load (name) {
    const PluginConfig = this.model('PluginConfig')
    const config = await PluginConfig.findById(name)
    const options = config && config.options || {}
    const enabled = Boolean(config && config.enabled)
    return { options, enabled }
  }

  async save (name, options) {
    const PluginConfig = this.model('PluginConfig')
    await PluginConfig.findByIdAndUpdate(
      name,
      { $set: { options } },
      { upsert: true }
    )
  }
}
