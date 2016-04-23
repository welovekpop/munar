import { Module, command } from '../'

const sekshibot = require('../../package.json')
const plugged = require('plugged/package.json')
const mongoose = require('mongoose/package.json')

export default class System extends Module {
  author = 'Sooyou'
  description = 'Simple tools for module management & system information'

  manager () {
    return this.sekshi.modules
  }

  @command('version')
  version (message) {
    const str = (pkg) => `${pkg.name} v${pkg.version}`
    message.reply(`Running ${str(sekshibot)} on ${str(plugged)}, ${str(mongoose)}`)
  }

  @command('reload', { role: command.ROLE.MANAGER })
  reloadmodule (message, name) {
    try {
      this.manager().reload(name)
      message.reply(`Reloaded module "${name}".`)
    } catch (e) {
      message.reply(`Could not reload "${name}": ${e.message}`)
    }
  }

  @command('unload', { role: command.ROLE.MANAGER })
  unloadmodule (message, name) {
    try {
      this.manager().unload(name)
      message.reply(`Unloaded module "${name}."`)
    } catch (e) {
      message.reply(`Could not unload "${name}": ${e.message}`)
    }
  }

  @command('load', { role: command.ROLE.MANAGER })
  loadmodule (message, name) {
    try {
      this.manager().load(name)
      message.reply(`Loaded module "${name}".`)
    } catch (e) {
      message.reply(`Could not load "${name}": ${e.message}`)
    }
  }

  @command('disable', { role: command.ROLE.MANAGER })
  disablemodule (message, name) {
    if (name.toLowerCase() === 'system') {
      message.reply('Cannot disable the System module.')
    } else {
      const mod = this.manager().get(name)
      if (mod) {
        mod.disable()
        message.reply(`Module "${name}" disabled.`)
      } else {
        message.reply(`Could not find the "${name}" module.`)
      }
    }
  }

  @command('enable', { role: command.ROLE.MANAGER })
  enablemodule (message, name) {
    let mod = this.manager().get(name)
    if (!mod) {
      try {
        mod = this.manager().load(name)
      } catch (e) {
        console.error(e)
        message.reply(`Could not load the "${name}" module.`)
      }
    }
    mod.enable()
    message.reply(`Module "${name}" enabled.`)
  }

  @command('moduleinfo', { role: command.ROLE.MANAGER })
  moduleinfo (message, name) {
    if (!name || name.length === 0) {
      message.reply('Usage: !moduleinfo "modulename"')
      return
    }

    const mod = this.manager().get(name)
    if (mod) {
      message.reply([
        `:small_blue_diamond: Module info for "${name}"`,
        `:white_small_square: Status: ${mod.enabled() ? 'enabled' : 'disabled'}`,
        `:white_small_square: Author: ${mod.author}`,
        `:white_small_square: Description: ${mod.description}`
      ].join('\n'))
    } else {
      message.reply(`Module "${name}" does not exist.`)
    }
  }

  @command('listmodules', { role: command.ROLE.MANAGER })
  listmodules (message) {
    const text = this.manager().known().map((name) => {
      const mod = this.manager().get(name)
      return `${name} ${mod && mod.enabled() ? '✔' : '✘'}`
    })
    message.reply(text.sort().join(', '))
  }

  @command('exit', { role: command.ROLE.MANAGER })
  exit (message) {
    message.reply('okay... </3 T_T')
    this.bot.stop()
  }
}
