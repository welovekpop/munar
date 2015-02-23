const os = require('os')
const SekshiModule = require('../Module')

export default class System extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'System'
    this.author = 'Sooyou'
    this.version = '0.11.1'
    this.description = 'Simple tools for module management & system information'

    super(sekshi, options)

    this.permissions = {
      sysinfo: sekshi.USERROLE.COHOST,
      moduleinfo: sekshi.USERROLE.COHOST,
      listmodules: sekshi.USERROLE.COHOST,
      togglemodule: sekshi.USERROLE.COHOST,
      reloadmodules: sekshi.USERROLE.COHOST,
      exit: sekshi.USERROLE.MANAGER
    }
  }

  moduleinfo(user, modulename) {
    if(!modulename || modulename.length === 0) {
        this.sekshi.sendChat(`usage: !moduleinfo "modulename"`)
        return;
    }

    const mod = this.sekshi.getModule(modulename)
    if (mod) {
      this.sekshi.sendChat(
        `:${mod.enabled() ? 'small_blue_diamond' : 'small_red_triangle'}: Module info for "${mod.name}" ` +
        `:white_small_square: Version: ${mod.version} ` +
        `:white_small_square: Author: ${mod.author} ` +
        `:white_small_square: Description: ${mod.description}`
      )
    }
    else {
      this.sekshi.sendChat(`Module "${modulename}" does not exist.`);
    }
  }

  reloadmodules(user) {
    this.sekshi.reloadmodules()
  }

  listmodules(user) {
    let text = []
    for (let name in this.sekshi.modules) if (this.sekshi.modules.hasOwnProperty(name)) {
      let mod = this.sekshi.modules[name]
      text.push(`${mod.name} ${mod.enabled() ? '✔' : '✘'}`)
    }
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