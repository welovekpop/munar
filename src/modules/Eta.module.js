import { Module, command } from '../'
import findIndex from 'array-findindex'

const debug = require('debug')('sekshi:eta')

export default class Eta extends Module {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.description = 'Provides an estimation of when people get to play their song.'
  }

  @command('eta')
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
