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
    this.name = 'Disconnect'
    this.author = 'Sooyou'
    this.version = '1.0.0'
    this.description = 'Provides basic moderation tools'

    super(sekshi, options)

    this.waitlist = []
    this.dropped = []

    this.permissions = {
      dc: sekshi.USERROLE.NONE
    }

    this.onWaitlistUpdate = this.onWaitlistUpdate.bind(this)
    this.onUserLeave = this.onUserLeave.bind(this)
    sekshi.on(sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    sekshi.on(sekshi.USER_LEAVE, this.onUserLeave)
  }

  defaultOptions() {
    return {
      timeLimit: 10 * 60 // minutes
    }
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onWaitlistUpdate)
    this.sekshi.removeListener(this.sekshi.USER_LEAVE, this.onUserLeave)
  }

  onWaitlistUpdate(oldWaitlist, newWaitlist) {
    this.waitlist = oldWaitlist
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
            this.sekshi.sendChat(`@${user.username} Your last disconnect was too long (${time.fromNow(true)}) ago. Disconnects are only valid for ${maxDuration}.`)
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