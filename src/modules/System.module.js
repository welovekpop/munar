const os = require('os')
const SekshiModule = require('../Module')

export default class System extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'Sooyou'
    this.version = '0.11.1'
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
  }

  disablemodule(user, name) {
    this.sekshi.disable(name)
  }
  enablemodule(user, name) {
    this.sekshi.enable(name)
  }

  moduleinfo(user, name) {
    if(!name || name.length === 0) {
        this.sekshi.sendChat(`usage: !moduleinfo "modulename"`)
        return;
    }

    const mod = this.sekshi.getModule(name)
    if (mod) {
      this.sekshi.sendChat(
        `:${mod.enabled() ? 'small_blue_diamond' : 'small_red_triangle'}: Module info for "${name}" ` +
        `:white_small_square: Version: ${mod.version} ` +
        `:white_small_square: Author: ${mod.author} ` +
        `:white_small_square: Description: ${mod.description}`
      )
    }
    else {
      this.sekshi.sendChat(`Module "${name}" does not exist.`);
    }
  }

  reloadmodules(user) {
    this.sekshi.reloadModules()
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
    this.sekshi.unloadModules()
    process.exit(0)
  }
}