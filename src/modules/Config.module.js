import { Module, command } from '../'

const debug = require('debug')('sekshi:config')

const configCommands = [ 'set', 'get', 'add', 'remove' ]

export default class Config extends Module {
  author = 'ReAnna'
  description = 'Keeps plugin configuration.'

  @command('set', { role: command.ROLE.MANAGER })
  setCommand (message, ns, option, value) {
    this.config(message, 'set', ns, option, value)
  }

  @command('get', { role: command.ROLE.MANAGER })
  getCommand (message, ns, option, value) {
    this.config(message, 'get', ns, option, value)
  }

  set (message, ns, option, value) {
    let plugin = this.bot.getPlugin(ns)
    if (/^[0-9]+$/.test(value)) value = parseInt(value, 10)
    if (/^true|false$/.test(value)) value = value === 'true'
    debug('value', typeof value, value)
    plugin.setOption(option, value)
    message.reply(`"${ns}.${option}" set to ${value}`)
  }

  get (message, ns, option) {
    let plugin = this.bot.getPlugin(ns)
    if (option) {
      message.reply(`"${ns}.${option}": ${plugin.getOption(option)}`)
    } else {
      let options = plugin.getOptions()
      debug('all options', options)
      for (let option in options) {
        message.reply(`${ns}.${option}: ${options[option]}`)
      }
    }
  }

  add (message, ns, option, ...values) {
    let plugin = this.bot.getPlugin(ns)
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
    message.reply(`added values to "${ns}.${option}".`)
  }
  remove (message, ns, option, ...values) {
    let plugin = this.bot.getPlugin(ns)
    let arr = plugin.getOption(option)
    if (Array.isArray(arr)) {
      arr = arr.filter((val) => values.indexOf(val) === -1)
    } else {
      message.reply(`"${ns}.${option}" is not a list.`)
      return
    }
    plugin.setOption(option, arr)
    message.reply(`removed values from "${ns}.${option}".`)
  }

  @command('config', 'cf', { role: command.ROLE.MANAGER })
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
}
