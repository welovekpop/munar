import { Module, command } from '../'

const debug = require('debug')('sekshi:config')

const configCommands = [ 'set', 'get', 'add', 'remove' ]

export default class Config extends Module {
  author = 'ReAnna'
  description = 'Keeps module configuration.'

  @command('set', { role: command.ROLE.MANAGER })
  setCommand(message, ns, option, value) {
    this.config(message, 'set', ns, option, value)
  }

  @command('get', { role: command.ROLE.MANAGER })
  getCommand(message, ns, option, value) {
    this.config(message, 'get', ns, option, value)
  }

  set(message, ns, option, value) {
    let mod = this.sekshi.getModule(ns)
    if (/^[0-9]+$/.test(value)) value = parseInt(value, 10)
    if (/^true|false$/.test(value)) value = value === 'true'
    debug('value', typeof value, value)
    mod.setOption(option, value)
    message.reply(`"${ns}.${option}" set to ${value}`)
  }

  get(message, ns, option) {
    let mod = this.sekshi.getModule(ns)
    if (option) {
      message.reply(`"${ns}.${option}": ${mod.getOption(option)}`)
    }
    else {
      let options = mod.getOptions()
      debug('all options', options)
      for (let option in options) {
        message.reply(`${ns}.${option}: ${options[option]}`)
      }
    }
  }

  add(message, ns, option, ...values) {
    let mod = this.sekshi.getModule(ns)
    let arr = mod.getOption(option)
    if (arr == null)             arr = values
    else if (Array.isArray(arr)) arr = arr.concat(values)
    else {
      message.reply(`"${ns}.${option}" is not a list.`)
      return
    }
    mod.setOption(option, arr)
    message.reply(`added values to "${ns}.${option}".`)
  }
  remove(message, ns, option, ...values) {
    let mod = this.sekshi.getModule(ns)
    let arr = mod.getOption(option)
    if (Array.isArray(arr)) arr = arr.filter(val => values.indexOf(val) === -1)
    else {
      message.reply(`"${ns}.${option}" is not a list.`)
      return
    }
    mod.setOption(option, arr)
    message.reply(`removed values from "${ns}.${option}".`)
  }

  @command('config', 'cf', { role: command.ROLE.MANAGER })
  config(message, command, ns, ...args) {
    if (configCommands.indexOf(command) === -1) {
      message.reply(`"${command}" is not a command.`)
      return
    }
    if (!ns) {
      message.reply(`You should provide a module to configure.`)
    }

    let mod = this.sekshi.getModule(ns)
    if (!mod) {
      message.reply(`Could not find module "${ns}".`)
      return
    }

    this[command](message, ns, ...args)
  }

}
