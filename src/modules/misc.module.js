const SekshiModule = require('../Module')
const findIndex = require('array-findindex')

export default class Misc extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'Misc'
    this.author = 'Sooyou'
    this.version = '0.2.0'
    this.description = 'Provides basic moderation tools'

    super(sekshi, options)

    this.permissions = {
      eta: sekshi.USERROLE.NONE,
      help: sekshi.USERROLE.NONE
    }
  }

  eta(user) {
    if (user.id === this.sekshi.getCurrentDJ().id) {
      this.sekshi.sendChat(`@${user.username} Your turn is right now!`)
    }
    const position = findIndex(this.sekshi.getWaitlist(), uid => user.id === uid)
    if (position === 0) {
      this.sekshi.sendChat(`@${user.username} Your turn is next!`)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Your turn is in around ${position * 4} minutes!`)
    }
  }

  help(user) {
    this.sekshi.sendChat(`@${user.username} For more help or information, check out our website: http://welovekpop.club`)
  }

}
