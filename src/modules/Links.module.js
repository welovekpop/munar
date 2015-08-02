const debug = require('debug')('sekshi:social-media')
const SekshiModule = require('../Module')
const command = require('../command')

export default class Links extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Throws links at people.'
  }

  @command('fb')
  showFacebook() {
    this.sekshi.sendChat('Like us on Facebook for the latest event announcements! https://facebook.com/welovekpop.club')
  }

  @command('web')
  showWebsite() {
    this.sekshi.sendChat('Check out our website for rules, tutorials, popular videos and more! http://welovekpop.club')
  }

  @command('gh')
  showGithub() {
    this.sekshi.sendChat('SekshiBot is on Github! Check out https://github.com/welovekpop for code and goodies :)')
  }

  @command('help')
  help(user) {
    this.sekshi.sendChat(`@${user.username} SekshiBot commands can be found on our website. http://welovekpop.club/sekshibot`)
  }

  @command('steam')
  steam() {
    this.sekshi.sendChat('Join us on steam! http://steamcommunity.com/groups/wlk_gaming')
  }

}
