const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:config')
const fs = require('fs')
const path = require('path')
const assign = require('object-assign')

export default class Config extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '1.0.0'
    this.description = 'Keeps module configuration.'

    super(sekshi, options)

    this.permissions = {
      set: sekshi.USERROLE.MANAGER,
      get: sekshi.USERROLE.BOUNCER,
      loadconfig: sekshi.USERROLE.MANAGER
    }

    this.onModuleLoaded = this.onModuleLoaded.bind(this)
  }

  defaultOptions() {
    return {
      dir: '../../.config/'
    }
  }

  init() {
    this._createConfigDir()

    this.sekshi.on('moduleloaded', this.onModuleLoaded)
  }
  destroy() {
    this.sekshi.removeListener('moduleloaded', this.onModuleLoaded)
  }

  onModuleLoaded(mod, name) {
    // best parameter order?!
    this._load(name, mod)
  }

  _dir() {
    return path.join(__dirname, this.options.dir)
  }
  _createConfigDir() {
    try {
      fs.statSync(this._dir())
    }
    catch (e) {
      // config dir does not exist
      try {
        fs.mkdirSync(this._dir())
      }
      catch (e) {
        debug('mkdir-err', e)
      }
    }
  }
  _save(ns, mod) {
    fs.writeFileSync(
      path.join(this._dir(), `${ns}.json`),
      // bit of a hack, storing enabled status in config files :"D
      JSON.stringify(assign(mod.options, { $enabled: mod.enabled() }), null, 2)
    )
  }
  _load(ns, mod) {
    try {
      let json = fs.readFileSync(path.join(this._dir(), `${ns}.json`))
      let config = JSON.parse(json)

      let options = Object.keys(config).filter(opt => opt !== '$enabled')
      options.forEach(opt => {
        mod.setOption(opt, config[opt])
      })

      if (config.$enabled) {
        mod.enable()
      }
    }
    catch (e) {
      // default "config"
      // not quite perfect, possibly!
      mod.enable()
    }
  }

  set(user, ns, option, value) {
    ns = ns.toLowerCase()
    let mod = this.sekshi.getModule(ns)
    if (mod) {
      if (/^[0-9]+$/.test(value)) value = parseInt(value, 10)
      debug('value', typeof value, value)
      mod.setOption(option, value)
      try {
        this._save(ns, mod)
        this.sekshi.sendChat(`@${user.username} "${ns}.${option}" set to ${value}`)
      }
      catch (e) {
        debug('set-err', e)
        this.sekshi.sendChat(`@${user.username} "${ns}.${option}" was set to ${value}, but could not be saved`)
      }
    }
    else {
      this.sekshi.sendChat(`@${user.username} Could not find module "${ns}"`)
    }
  }
  get(user, ns, option) {
    ns = ns.toLowerCase()
    let mod = this.sekshi.getModule(ns)
    if (mod) {
      this.sekshi.sendChat(`@${user.username} "${ns}.${option}": ${mod.getOption(option)}`)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Could not find module "${ns}"`)
    }
  }

}