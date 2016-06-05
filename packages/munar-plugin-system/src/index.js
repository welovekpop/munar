import { Plugin, command, permissions } from 'munar-core'
import pkg from 'munar-core/package.json'

export default class System extends Plugin {
  static description = 'Simple tools for plugin management & system information'

  manager () {
    return this.bot.plugins
  }

  @command('version')
  version (message) {
    message.reply(`Running ${pkg.name} v${pkg.version}`)
  }

  @command('reload', { role: permissions.ADMIN })
  reloadplugin (message, name) {
    try {
      this.manager().reload(name)
      message.reply(`Reloaded plugin "${name}".`)
    } catch (e) {
      message.reply(`Could not reload "${name}": ${e.message}`)
    }
  }

  @command('unload', { role: permissions.ADMIN })
  unloadplugin (message, name) {
    try {
      this.manager().unload(name)
      message.reply(`Unloaded plugin "${name}."`)
    } catch (e) {
      message.reply(`Could not unload "${name}": ${e.message}`)
    }
  }

  @command('load', { role: permissions.ADMIN })
  loadplugin (message, name) {
    try {
      this.manager().load(name)
      message.reply(`Loaded plugin "${name}".`)
    } catch (e) {
      message.reply(`Could not load "${name}": ${e.message}`)
    }
  }

  @command('disable', { role: permissions.ADMIN })
  disableplugin (message, name) {
    if (name.toLowerCase() === 'system') {
      message.reply('Cannot disable the System plugin.')
    } else {
      const plugin = this.manager().get(name)
      if (plugin) {
        this.manager().disable(plugin)
        message.reply(`Plugin "${name}" disabled.`)
      } else {
        message.reply(`Could not find the "${name}" plugin.`)
      }
    }
  }

  @command('enable', { role: permissions.ADMIN })
  enableplugin (message, name) {
    const manager = this.manager()
    let plugin = manager.get(name)
    if (!plugin) {
      try {
        plugin = manager.load(name)
      } catch (e) {
        console.error(e)
        message.reply(`Could not load the "${name}" plugin.`)
      }
    }
    manager.enable(plugin)
    message.reply(`Plugin "${name}" enabled.`)
  }

  @command('plugininfo', { role: permissions.MODERATOR })
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

  @command('listplugins', { role: permissions.MODERATOR })
  listplugins (message) {
    const manager = this.manager()
    const text = manager.known().map((name) => {
      const plugin = manager.get(name)
      let status = '❔'
      if (plugin) {
        status = manager.enabled(plugin) ? '✔' : '✘'
      }
      return `${name} ${status}`
    })
    message.reply(text.sort().join(', '))
  }

  @command('exit', { role: permissions.ADMIN })
  exit (message) {
    message.reply('okay... </3 T_T')
    this.bot.stop()
  }
}
