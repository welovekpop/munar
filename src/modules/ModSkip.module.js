const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class ModSkip extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '0.3.1'
    this.description = 'Simple DJ skipping tools'

    this.permissions = {
      skip: sekshi.USERROLE.BOUNCER,
      lockskip: sekshi.USERROLE.BOUNCER
    }
  }

  defaultOptions() {
    return {
      reasons: {
        kpop: 'This is a Korean music dedicated room, please only play music by Korean artists.',
        history: 'This song is in the history. Please play a different one.',
        duration: 'This song is too long. Please pick a shorter one.',
        quality: 'The audio quality of this song is less than ideal. Please pick a better quality one.',
        outro: 'Skipping the rest of this song!',
        op: 'This song has been played a lot recently. Please play a different one.'
      },
      lockskipPos: 1,
      cooldown: 7 // seconds
    }
  }

  init() {
    this._lastSkip = 0
  }

  _skipMessage(user, reason = false) {
    if (reason && this.options.reasons.hasOwnProperty(reason)) {
      reason = this.options.reasons[reason]
    }
    if (reason) {
      let dj = this.sekshi.getCurrentDJ()
      return `@${dj.username} ${reason}`
    }
    else {
      return `/me ${user.username} used skip!`
    }
  }

  skip(user, ...reason) {
    if (Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this.sekshi.sendChat(this._skipMessage(user, reason.join(' ')))
      this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id)
    }
  }

  lockskip(user, ...reason) {
    if (Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this.sekshi.sendChat(this._skipMessage(user, reason.join(' ')))
      this.sekshi.lockskipDJ(this.sekshi.getCurrentDJ().id, this.options.lockskipPos)
    }
  }

}