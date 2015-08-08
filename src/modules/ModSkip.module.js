const assign = require('object-assign')
const SekshiModule = require('../Module')
const command = require('../command')

export default class ModSkip extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Simple DJ skipping tools'
  }

  defaultOptions() {
    return {
      reasons: {
        kpop: 'This is a Korean music dedicated room, please only play music by Korean artists.',
        history: 'This song is in the history. Please play a different one.',
        duration: 'This song is too long. Please pick a shorter one.',
        quality: 'The audio quality of this song is less than ideal. Please pick a better quality one.',
        outro: 'Skipping the rest of this song!',
        op: 'This song has been played a lot recently. Please play a different one.',
        oneshot: 'This video is long and includes multiple songs and/or extended drama portions. Please play a different one.',
        unavailable: 'This video is unavailable or blocked. Please choose another.',
        ua: 'This video is unavailable or blocked. Please choose another.',
        blocked: 'This video is unavailable or blocked. Please choose another.'
      },
      lockskipPos: 1,
      cooldown: 7 // seconds
    }
  }

  init() {
    this._lastSkip = 0
  }

  getSkipMessage(reason) {
    if (this.options.reasons.hasOwnProperty(reason)) {
      reason = this.options.reasons[reason]
    }
    let dj = this.sekshi.getCurrentDJ()
    return `@${dj.username} ${reason}`
  }

  _skipMessage(user, reason = false) {
    return reason
      ? this.getSkipMessage(reason)
      : `/me ${user.username} used skip!`
  }

  _saveSkip(user, reason, isLockskip = false) {
    const history = this.sekshi.getModule('historylogger')
    if (history) {
      let entry = history.getCurrentEntry()
      if (entry) {
        entry.set('skip', { kind: isLockskip ? 'lockskip' : 'skip'
                          , user: user.id
                          , reason: reason
                          , time: Date.now() })
        entry.save()
      }
    }
  }

  @command('skip', { role: command.ROLE.BOUNCER })
  skip(user, ...reason) {
    const dj = this.sekshi.getCurrentDJ()
    if (!dj || !dj.id) {
      return this.sekshi.sendChat(`@${user.username} Nobody is DJing currently...`)
    }
    let isSekshi = user === this.sekshi.getSelf()
    if (isSekshi || Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this._saveSkip(user, reason.join(' ') || false)
      this.sekshi.sendChat(this._skipMessage(user, reason.join(' ')))
      this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id)
    }
  }

  @command('lockskip', 'ls', { role: command.ROLE.BOUNCER })
  lockskip(user, ...reason) {
    let isSekshi = user === this.sekshi.getSelf()
    if (isSekshi || Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this._saveSkip(user, reason.join(' ') || false, true)
      this.sekshi.sendChat(this._skipMessage(user, reason.join(' ')))
      this.sekshi.lockskipDJ(this.sekshi.getCurrentDJ().id, this.options.lockskipPos)
    }
  }

}
