const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:eta')
const findIndex = require('array-findindex')

export default class Misc extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.description = 'Provides an estimation of when people get to play their song.'

    this.permissions = {
      eta: sekshi.USERROLE.NONE
    }
  }

  eta(user) {
    if (user.id === this.sekshi.getCurrentDJ().id) {
      return this.sekshi.sendChat(`@${user.username} Your turn is right now!`)
    }
    const position = findIndex(this.sekshi.getWaitlist(), uid => user.id === uid)
    if (position === 0) {
      this.sekshi.sendChat(`@${user.username} Your turn is next!`)
    }
    else if (position === -1) {
      this.sekshi.sendChat(`@${user.username} You're not in the wait list!`)
    }
    else {
      this.sekshi.sendChat(`@${user.username} Your turn is in around ${position * 4} minutes!`)
    }
  }

}
