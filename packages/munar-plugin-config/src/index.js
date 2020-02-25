import { Plugin, command, permissions } from 'munar-core'
import Ultron from 'ultron'
import createDebug from 'debug'

const debug = createDebug('munar:config')

const configCommands = [ 'set', 'get', 'add', 'remove' ]

class PluginConfigModel {
  static collection = 'plugin_config'
  static timestamps = true

  static schema = {
    _id: { type: String, index: true, unique: true },
    enabled: { type: Boolean, default: false },
    options: {
      default: {}
    }
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
    events.on('discovered', this.onPluginDiscovered)
    events.on('load', this.onPluginLoad)

    this.events.push(events)
  }

  disable () {
    this.events.forEach((events) => events.remove())
    this.events = []
  }

  set (message, ns, option, value) {
    const plugin = this.bot.getPlugin(ns)
    if (/^[0-9]+$/.test(value)) {
      value = parseInt(value, 10)
    }
    if (/^true|false$/.test(value)) {
      value = value === 'true'
    }
    debug('value', typeof value, value)
    plugin.setOption(option, value)
    this.save(ns, plugin.getOptions())
    message.reply(`"${ns}.${option}" set to ${value}`)
  }

  get (message, ns, option) {
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

  add (message, ns, option, ...values) {
    const plugin = this.bot.getPlugin(ns)
    let arr = plugin.getOption(option)
    if (arr == null) {
      arr = values
    } else if (Array.isArray(arr)) {
      arr = arr.concat(values)
    } else {
      message.reply(`"${ns}.${option}" is not a list.`)
      return
    }
    plugin.setOption(option, arr)
    this.save(ns, plugin.getOptions())
    message.reply(`added values to "${ns}.${option}".`)
  }
  remove (message, ns, option, ...values) {
    const plugin = this.bot.getPlugin(ns)
    let arr = plugin.getOption(option)
    if (Array.isArray(arr)) {
      arr = arr.filter((val) => values.indexOf(val) === -1)
    } else {
      message.reply(`"${ns}.${option}" is not a list.`)
      return
    }
    plugin.setOption(option, arr)
    this.save(ns, plugin.getOptions())
    message.reply(`removed values from "${ns}.${option}".`)
  }

  @command('config', 'cf', { role: permissions.MANAGER })
  config (message, command, ns, ...args) {
    if (configCommands.indexOf(command) === -1) {
      message.reply(`"${command}" is not a command.`)
      return
    }
    if (!ns) {
      message.reply('You should provide a plugin to configure.')
    }

    const plugin = this.bot.getPlugin(ns)
    if (!plugin) {
      message.reply(`Could not find plugin "${ns}".`)
      return
    }

    this[command](message, ns, ...args)
  }

  onPluginDiscovered = async (name) => {
    debug('load config', name)
    const { options, enabled } = await this.load(name)
    await this.bot.plugins.load(name, {
      ...options.toJSON(),
      enable: enabled
    })
  }

  onPluginLoad = (instance, name) => {
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
