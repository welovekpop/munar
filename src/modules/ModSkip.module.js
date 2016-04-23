import { Module, command } from '../'

export default class ModSkip extends Module {
  author = 'ReAnna'
  description = 'Simple DJ skipping tools'

  source = this.adapter('uwave').getChannel('main')

  defaultOptions () {
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

  init () {
    this._lastSkip = 0
  }

  getSkipMessage (message, reason) {
    if (this.options.reasons.hasOwnProperty(reason)) {
      reason = this.options.reasons[reason]
    }
    const dj = message.source.getCurrentDJ()
    return `@${dj.username} ${reason}`
  }

  _skipMessage (message, reason = false) {
    return reason
      ? this.getSkipMessage(message, reason)
      : `/me ${message.username} used skip!`
  }

  _saveSkip (user, reason, isLockskip = false) {
    const history = this.sekshi.getModule('historylogger')
    if (history) {
      let entry = history.getCurrentEntry()
      if (entry) {
        entry.set('skip', {
          kind: isLockskip ? 'lockskip' : 'skip',
          user: user.id,
          reason: reason,
          time: Date.now()
        })
        entry.save()
      }
    }
  }

  @command('skip', { role: command.ROLE.BOUNCER })
  skip (message, ...reason) {
    const dj = this.source.getCurrentDJ()
    if (!dj || !dj.id) {
      return message.reply('Nobody is DJing currently...')
    }
    let isSelf = message.user.id === message.source.getSelf().id
    if (isSelf || Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this._saveSkip(message.user, reason.join(' ') || false)
      this.source.send(this._skipMessage(message, reason.join(' ')))
      this.source.skipDJ(dj.id)
    }
  }

  @command('lockskip', 'ls', { role: command.ROLE.BOUNCER })
  lockskip (message, ...reason) {
    const dj = this.source.getCurrentDJ()
    if (!dj || !dj.id) {
      return message.reply('Nobody is DJing currently...')
    }
    let isSelf = message.user.id === message.source.getSelf().id
    if (isSelf || Date.now() - this.options.cooldown * 1000 > this._lastSkip) {
      this._lastSkip = Date.now()
      this._saveSkip(message.user, reason.join(' ') || false, true)
      this.sekshi.sendChat(this._skipMessage(message, reason.join(' ')))
      this.sekshi.lockskipDJ(dj.id, this.options.lockskipPos)
    }
  }
}
