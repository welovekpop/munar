const os = require('os')
const SekshiModule = require('../Module')

export default class System extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'Sooyou'
    this.version = '0.12.0'
    this.description = 'Simple tools for module management & system information'

    super(sekshi, options)

    this.permissions = {
      sysinfo: sekshi.USERROLE.COHOST,
      moduleinfo: sekshi.USERROLE.MANAGER,
      listmodules: sekshi.USERROLE.MANAGER,
      togglemodule: sekshi.USERROLE.COHOST,
      reloadmodules: sekshi.USERROLE.COHOST,
      reloadmodule: sekshi.USERROLE.MANAGER,
      enablemodule: sekshi.USERROLE.MANAGER,
      disablemodule: sekshi.USERROLE.MANAGER,
      exit: sekshi.USERROLE.MANAGER
    }
  }

  reloadmodule(user, name) {
    this.sekshi.reloadModule(name)
    this.sekshi.sendChat(`@${user.username} Reloaded module "${name}".`)
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

  togglemodule(user, modulename) {
    if(!modulename || modulename.length === 0) {
      this.sekshi.sendChat(`usage: !togglemodule "modulename"`);
      return;
    }

    const mod = this.sekshi.getModule(modulename)
    if (mod) {
      if (mod.enabled()) {
        mod.disable()
      }
      else {
        mod.enable()
      }
      this.sekshi.sendChat(`@${user.username} :white_check_mark: ${mod.name} ` +
                           `${mod.enabled() ? 'enabled' : 'disabled'}`)
    }
  }

  sysinfo(user) {
    this.sekshi.sendChat(
      `OS: ${os.type()} ${os.release()} :white_small_square: Platform: ${os.platform()} ` +
      `:white_small_square: Architecture: ${os.arch()} :white_small_square: Uptime: ${os.uptime()} ` +
      `:white_small_square: load: ${os.loadavg()}`
    )
  }

  exit(user) {
    this.sekshi.sendChat(`@${user.username} okay... </3 T_T`)
    this.sekshi.stop()
  }
}