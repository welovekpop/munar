const debug = require('debug')('sekshi:social-media')
const SekshiModule = require('../Module')

export default class Links extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'Links'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Throws links at people.'

    super(sekshi, options)

    this.permissions = {
      fb: sekshi.USERROLE.NONE,
      web: sekshi.USERROLE.NONE,
      gh: sekshi.USERROLE.NONE
    }
  }

  fb() {
    this.sekshi.sendChat('Like us on Facebook for the latest event announcements! https://facebook.com/welovekpop.club')
  }

  web() {
    this.sekshi.sendChat('Check out our website for rules, tutorials, popular videos and more! http://welovekpop.club')
  }

  gh() {
    this.sekshi.sendChat('SekshiBot is open source! Check https://github.com/welovekpop for more :)')
  }

}