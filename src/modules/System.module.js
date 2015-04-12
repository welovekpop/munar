const os = require('os')
const SekshiModule = require('../Module')

export default class System extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.version = '1.0.0'
    this.description = 'Simple tools for module management & system information'

    this.permissions = {
      listmodules: sekshi.USERROLE.MANAGER,
      reloadmodules: sekshi.USERROLE.COHOST,
      moduleinfo: sekshi.USERROLE.MANAGER,
      unloadmodule: sekshi.USERROLE.MANAGER,
      loadmodule: sekshi.USERROLE.MANAGER,
      reloadmodule: sekshi.USERROLE.MANAGER,
      enablemodule: sekshi.USERROLE.MANAGER,
      disablemodule: sekshi.USERROLE.MANAGER,
      exit: sekshi.USERROLE.MANAGER
    }
  }

  reloadmodule(user, name) {
    try {
      this.sekshi.reloadModule(name)
      this.sekshi.sendChat(`@${user.username} Reloaded module "${name}".`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not reload "${name}": ${e.message}`)
    }
  }

  unloadmodule(user, name) {
    try {
      this.sekshi.unloadModule(name)
      this.sekshi.sendChat(`@${user.username} Unloaded module "${name}."`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not unload "${name}": ${e.message}`)
    }
  }
  loadmodule(user, name) {
    try {
      this.sekshi.loadModule(name)
      this.sekshi.sendChat(`@${user.username} Loaded module "${name}".`)
    }
    catch (e) {
      this.sekshi.sendChat(`@${user.username} Could not load "${name}": ${e.message}`)
    }
  }

  disablemodule(user, name) {
    if (name.toLowerCase() === 'system') {
      this.sekshi.sendChat(`@${user.username} Cannot disable the System module.`)
    }
    else {
      this.sekshi.disable(name)
      this.sekshi.sendChat(`@${user.username} Module "${name}" disabled.`)
    }
  }
  enablemodule(user, name) {
    this.sekshi.enable(name)
    this.sekshi.sendChat(`@${user.username} Module "${name}" enabled.`)
  }

  moduleinfo(user, name) {
    if(!name || name.length === 0) {
        this.sekshi.sendChat(`usage: !moduleinfo "modulename"`)
        return;
    }

    const mod = this.sekshi.getModule(name)
    if (mod) {
      [ `:small_blue_diamond: Module info for "${name}"`,
        `:white_small_square: Status: ${mod.enabled() ? 'enabled' : 'disabled'}`,
        `:white_small_square: Version: ${mod.version}`,
        `:white_small_square: Author: ${mod.author}`,
        `:white_small_square: Description: ${mod.description}`,
      ].forEach(this.sekshi.sendChat, this.sekshi)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Module "${name}" does not exist.`);
    }
  }

  reloadmodules(user) {
    this.sekshi.reloadModules()
    this.sekshi.sendChat(`@${user.username} Reloaded all modules.`)
  }

  listmodules(user) {
    const text = this.sekshi.getAvailableModules().map(name => {
      const mod = this.sekshi.getModule(name)
      return `${name} ${mod && mod.enabled() ? '✔' : '✘'}`
    })
    this.sekshi.sendChat(text.sort().join(', '), 20 * 1000)
  }

  exit(user) {
    this.sekshi.sendChat(`@${user.username} okay... </3 T_T`)
    this.sekshi.stop()
  }
}