const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:config')
const fs = require('fs')
const path = require('path')
const assign = require('object-assign')

export default class Config extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '1.1.0'
    this.description = 'Keeps module configuration.'

    this.permissions = {
      set: sekshi.USERROLE.MANAGER,
      get: sekshi.USERROLE.BOUNCER
    }

  }

  set(user, ns, option, value) {
    if (!ns) return
    let mod = this.sekshi.getModule(ns)
    if (mod) {
      if (/^[0-9]+$/.test(value)) value = parseInt(value, 10)
      if (/^true|false$/.test(value)) value = value === 'true'
      debug('value', typeof value, value)
      mod.setOption(option, value)
      this.sekshi.sendChat(`@${user.username} "${ns}.${option}" set to ${value}`)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Could not find module "${ns}"`)
    }
  }

  get(user, ns, option) {
    if (!ns) return
    let mod = this.sekshi.getModule(ns)
    if (mod) {
      if (option) {
        this.sekshi.sendChat(`@${user.username} "${ns}.${option}": ${mod.getOption(option)}`)
      }
      else {
        let options = mod.getOptions()
        debug('all options', options)
        for (var option in options) {
          this.sekshi.sendChat(`@${user.username} ${ns}.${option}: ${options[option]}`)
        }
      }
    }
    else {
      this.sekshi.sendChat(`@${user.username} Could not find module "${ns}"`)
    }
  }

}
