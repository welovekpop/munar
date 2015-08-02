const SekshiModule = require('../Module')
const command = require('../command')
const sekshibot = require('../../package.json')
const plugged = require('plugged/package.json')
const mongoose = require('mongoose/package.json')

export default class System extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.description = 'Simple tools for module management & system information'
  }

  @command('version')
  version(user) {
    const str = pkg => `${pkg.name} v${pkg.version}`
    this.sekshi.sendChat(
      `@${user.username} Running ${str(sekshibot)} on ${str(plugged)}, ${str(mongoose)}`
    )
  }

  @command('reloadmodule', { role: command.ROLE.MANAGER })
  reloadmodule(user, name) {
    try {
      this.sekshi.reloadModule(name)
      this.sekshi.sendChat(`@${user.username} Reloaded module "${name}".`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not reload "${name}": ${e.message}`)
    }
  }

  @command('unloadmodule', 'unload', { role: command.ROLE.MANAGER })
  unloadmodule(user, name) {
    try {
      this.sekshi.unloadModule(name)
      this.sekshi.sendChat(`@${user.username} Unloaded module "${name}."`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not unload "${name}": ${e.message}`)
    }
  }
  @command('loadmodule', 'load', { role: command.ROLE.MANAGER })
  loadmodule(user, name) {
    try {
      this.sekshi.loadModule(name)
      this.sekshi.sendChat(`@${user.username} Loaded module "${name}".`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not load "${name}": ${e.message}`)
    }
  }

  @command('disablemodule', 'disable', { role: command.ROLE.MANAGER })
  disablemodule(user, name) {
    if (name.toLowerCase() === 'system') {
      this.sekshi.sendChat(`@${user.username} Cannot disable the System module.`)
    }
    else {
      this.sekshi.disable(name)
      this.sekshi.sendChat(`@${user.username} Module "${name}" disabled.`)
    }
  }
  @command('enablemodule', 'enable', { role: command.ROLE.MANAGER })
  enablemodule(user, name) {
    if (!this.sekshi.getModule(name)) {
      this.sekshi.loadModule(name)
    }
    this.sekshi.enable(name)
    this.sekshi.sendChat(`@${user.username} Module "${name}" enabled.`)
  }

  @command('moduleinfo', { role: command.ROLE.MANAGER })
  moduleinfo(user, name) {
    if(!name || name.length === 0) {
        this.sekshi.sendChat(`usage: !moduleinfo "modulename"`)
        return;
    }

    const mod = this.sekshi.getModule(name)
    if (mod) {
      [ `:small_blue_diamond: Module info for "${name}"`,
        `:white_small_square: Status: ${mod.enabled() ? 'enabled' : 'disabled'}`,
        `:white_small_square: Author: ${mod.author}`,
        `:white_small_square: Description: ${mod.description}`,
      ].forEach(this.sekshi.sendChat, this.sekshi)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Module "${name}" does not exist.`);
    }
  }

  @command('listmodules', { role: command.ROLE.MANAGER })
  listmodules(user) {
    const text = this.sekshi.getAvailableModules().map(name => {
      const mod = this.sekshi.getModule(name)
      return `${name} ${mod && mod.enabled() ? '✔' : '✘'}`
    })
    this.sekshi.sendChat(text.sort().join(', '), 20 * 1000)
  }

  @command('exit', { role: command.ROLE.MANAGER })
  exit(user) {
    this.sekshi.sendChat(`@${user.username} okay... </3 T_T`)
    this.sekshi.stop()
  }
}
