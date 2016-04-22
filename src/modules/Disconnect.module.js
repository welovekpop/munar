import { Module, command } from '../'
import moment from 'moment'
import mongoose from 'mongoose'

const debug = require('debug')('sekshi:disconnect')

const Disconnections = mongoose.modelNames().indexOf('Disconnections') === -1
  ? mongoose.model('Disconnections', {
      _id: Number, // user id
      position: Number,
      time: { type: Date, default: Date.now }
    })
  : mongoose.model('Disconnections')

const MINUTE = 1000 * 60

export default class Disconnect extends Module {
  author = 'Sooyou'
  description = 'Puts disconnected users back at their original wait list spot.'

  Disconnection = Disconnections

  defaultOptions() {
    return {
      timeLimit: 2 * 60, // minutes
      autodc: false
    }
  }

  init() {
    this.waitlist = []
    this.sekshi.on(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    this.sekshi.on(this.sekshi.DJ_LIST_LOCKED, this.onWaitlistLock)
    this.sekshi.on(this.sekshi.USER_LEAVE, this.onUserLeave)
    this.sekshi.on(this.sekshi.USER_JOIN, this.onUserJoin)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    this.sekshi.removeListener(this.sekshi.DJ_LIST_LOCKED, this.onWaitlistLock)
    this.sekshi.removeListener(this.sekshi.USER_LEAVE, this.onUserLeave)
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.onUserJoin)
  }

  onWaitlistUpdate = (oldWaitlist, newWaitlist) => {
    this.waitlist = oldWaitlist
  }

  onWaitlistLock = (e) => {
    if (e.clearWaitlist) {
      debug('wait list cleared, invalidating disconnects')
      Disconnections.remove({}).exec()
    }
  }

  onUserLeave = (user) => {
    if(!user)
      return;

    debug('user disconnected', user.username)
    for(var i = this.waitlist.length - 1; i >= 0; i--) {
      if (this.waitlist[i] == user.id) {
        Disconnections.update(
          { _id: user.id },
          { position: i, time: Date.now() },
          { upsert: true }
        ).exec()
        break
      }
    }
  }

  onUserJoin = (user) => {
    if (!this.options.autodc || !user || user.guest) {
      return
    }
    setTimeout(() => {
      Disconnections.findById(user.id).exec().then(drop => {
        if (drop && drop.time > Date.now() - this.options.timeLimit * MINUTE) {
          this.undrop(user, drop)
        }
      })
    }, 2200)
  }

  undrop(user, drop) {
    const time = moment(drop.time)
    this.sekshi.sendChat(`:white_check_mark: @${user.username} disconnected ${time.fromNow()} ` +
                         `from position ${drop.position + 1}.`)

    const removeDrop = () => {
      Disconnections.remove({ _id: drop.id }).exec().then(
        () => { debug('removed drop', drop.id) },
        e  => { debug('drop remove error', e) }
      )
    }
    if (this.sekshi.getWaitlist().indexOf(drop.id) < 0) {
      this.sekshi.addToWaitlist(drop.id, () => {
        this.sekshi.moveDJ(drop.id, drop.position, removeDrop)
      })
    }
    else {
      this.sekshi.moveDJ(drop.id, drop.position, removeDrop)
    }
  }

  @command('dc')
  dc(user) {
    debug('!dc', user.username)

    Disconnections.findById(user.id).exec()
      .then(drop => {
        if (drop) {
          debug('found drop')
          if (drop.time > Date.now() - this.options.timeLimit * MINUTE) {
            this.undrop(user, drop)
          }
          else {
            const timeLimit = moment.duration(this.options.timeLimit, 'minutes').humanize()
            this.sekshi.sendChat(`@${user.username} Your last disconnect was too long ago. ` +
                                 `Disconnects are only valid for ${maxDuration}.`)
          }
        }
        else {
          this.sekshi.sendChat(`@${user.username} I couldn't find you in the database!`)
        }
      })
      .catch(e => {
        debug('!dc error', e)
        this.sekshi.sendChat(`@${user.username} I couldn't find you in the database!`)
      })
  }
}
