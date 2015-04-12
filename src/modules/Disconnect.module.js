const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:disconnect')
const moment = require('moment')
const mongoose = require('mongoose')

const Disconnections = mongoose.modelNames().indexOf('Disconnections') === -1
  ? mongoose.model('Disconnections', {
      _id: Number, // user id
      position: Number,
      time: { type: Date, default: Date.now }
    })
  : mongoose.model('Disconnections')

export default class Disconnect extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.version = '1.0.1'
    this.description = 'Puts disconnected users back at their original wait list spot.'

    this.permissions = {
      dc: sekshi.USERROLE.NONE
    }

    this.Disconnection = Disconnections

    this.onWaitlistUpdate = this.onWaitlistUpdate.bind(this)
    this.onWaitlistLock = this.onWaitlistLock.bind(this)
    this.onUserLeave = this.onUserLeave.bind(this)
  }

  defaultOptions() {
    return {
      timeLimit: 2 * 60 // minutes
    }
  }

  init() {
    this.waitlist = []
    this.sekshi.on(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    this.sekshi.on(this.sekshi.DJ_LIST_LOCKED, this.onWaitlistLock)
    this.sekshi.on(this.sekshi.USER_LEAVE, this.onUserLeave)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    this.sekshi.removeListener(this.sekshi.DJ_LIST_LOCKED, this.onWaitlistLock)
    this.sekshi.removeListener(this.sekshi.USER_LEAVE, this.onUserLeave)
  }

  onWaitlistUpdate(oldWaitlist, newWaitlist) {
    this.waitlist = oldWaitlist
  }

  onWaitlistLock(e) {
    if (e.clearWaitlist) {
      debug('wait list cleared, invalidating disconnects')
      Disconnections.remove({}).exec()
    }
  }

  onUserLeave(user) {
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

  dc(user) {
    debug('!dc', user.username)

    Disconnections.findById(user.id).exec().then(
      drop => {
        if (drop) {
          debug('found drop')
          const time = moment(drop.time)
          const limit = moment().subtract(this.options.timeLimit, 'minutes')
          const maxDuration = moment.duration(this.options.timeLimit, 'minutes').humanize()
          if (time.isBefore(limit)) {
            this.sekshi.sendChat(`@${user.username} Your last disconnect was too long ago (${time.fromNow(true)}). Disconnects are only valid for ${maxDuration}.`)
            return
          }
          this.sekshi.sendChat(`:white_check_mark: @${user.username} disconnected ${time.fromNow()} ` +
                               `from position ${drop.position + 1}.`)

          const removeDrop = () => {
            Disconnections.remove({ _id: drop.id }).exec().then(
              () => { debug('removed drop', drop.id) },
              e => { debug('drop remove error', e) }
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
        else {
          this.sekshi.sendChat(`@${user.username} I couldn't find you in the database!`)
        }
      },
      e => {
        debug('!dc error', e)
        this.sekshi.sendChat(`@${user.username} I couldn't find you in the database!`)
      }
    )
  }
}