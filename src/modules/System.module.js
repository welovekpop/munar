import { Module, command } from '../'

const pkg = require('../../package.json')

export default class System extends Module {
  author = 'Sooyou'
  description = 'Simple tools for plugin management & system information'

  manager () {
    return this.bot.plugins
  }

  @command('version')
  version (message) {
    message.reply(`Running ${pkg.name} v${pkg.version}`)
  }

  @command('reload', { role: command.ROLE.MANAGER })
  reloadplugin (message, name) {
    try {
      this.manager().reload(name)
      message.reply(`Reloaded plugin "${name}".`)
    } catch (e) {
      message.reply(`Could not reload "${name}": ${e.message}`)
    }
  }

  @command('unload', { role: command.ROLE.MANAGER })
  unloadplugin (message, name) {
    try {
      this.manager().unload(name)
      message.reply(`Unloaded plugin "${name}."`)
    } catch (e) {
      message.reply(`Could not unload "${name}": ${e.message}`)
    }
  }

  @command('load', { role: command.ROLE.MANAGER })
  loadplugin (message, name) {
    try {
      this.manager().load(name)
      message.reply(`Loaded plugin "${name}".`)
    } catch (e) {
      message.reply(`Could not load "${name}": ${e.message}`)
    }
  }

  @command('disable', { role: command.ROLE.MANAGER })
  disableplugin (message, name) {
    if (name.toLowerCase() === 'system') {
      message.reply('Cannot disable the System plugin.')
    } else {
      const plugin = this.manager().get(name)
      if (plugin) {
        plugin.disable()
        message.reply(`Plugin "${name}" disabled.`)
      } else {
        message.reply(`Could not find the "${name}" plugin.`)
      }
    }
  }

  @command('enable', { role: command.ROLE.MANAGER })
  enableplugin (message, name) {
    let plugin = this.manager().get(name)
    if (!plugin) {
      try {
        plugin = this.manager().load(name)
      } catch (e) {
        console.error(e)
        message.reply(`Could not load the "${name}" plugin.`)
      }
    }
    plugin.enable()
    message.reply(`Plugin "${name}" enabled.`)
  }

  @command('plugininfo', { role: command.ROLE.MANAGER })
  plugininfo (message, name) {
    if (!name || name.length === 0) {
      message.reply('Usage: !plugininfo "pluginname"')
      return
    }

    const plugin = this.manager().get(name)
    if (plugin) {
      message.reply([
        `:small_blue_diamond: Plugin info for "${name}"`,
        `:white_small_square: Status: ${plugin.enabled() ? 'enabled' : 'disabled'}`,
        `:white_small_square: Author: ${plugin.author}`,
        `:white_small_square: Description: ${plugin.description}`
      ].join('\n'))
    } else {
      message.reply(`Plugin "${name}" does not exist.`)
    }
  }

  @command('listplugins', { role: command.ROLE.MANAGER })
  listplugins (message) {
    const text = this.manager().known().map((name) => {
      const plugin = this.manager().get(name)
      return `${name} ${plugin && plugin.enabled() ? '✔' : '✘'}`
    })
    message.reply(text.sort().join(', '))
  }

  @command('exit', { role: command.ROLE.MANAGER })
  exit (message) {
    message.reply('okay... </3 T_T')
    this.bot.stop()
  }
}
