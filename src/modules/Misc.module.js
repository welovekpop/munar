const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:misc')
const findIndex = require('array-findindex')

export default class Misc extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'Sooyou'
    this.version = '0.2.0'
    this.description = 'Provides miscellaneous tools'

    super(sekshi, options)

    this.permissions = {
      eta: sekshi.USERROLE.NONE
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

}
