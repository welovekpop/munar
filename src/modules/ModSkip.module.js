const assign = require('object-assign')

export default class ModSkip {

  constructor(sekshi, options = {}) {
    this.name = 'ModSkip'
    this.author = 'ReAnna'
    this.version = '0.2.0'
    this.description = 'Simple DJ skipping tools'

    this.sekshi = sekshi
    this.options = assign({
      reasons: {
        kpop: 'This is a Korean music dedicated room, please only play music by Korean artists.',
        history: 'This song is in the history. Please pick another.',
        duration: 'This song is too long. Please pick a shorter one.'
      },
      lockskipPos: 1
    }, options)

    this.permissions = {
      skip: sekshi.USERROLE.BOUNCER,
      lockskip: sekshi.USERROLE.BOUNCER
    }
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

  skip(user, reason) {
    this.sekshi.sendChat(this._skipMessage(user, reason))
    this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id)
  }

  lockskip(user, reason) {
    this.sekshi.sendChat(this._skipMessage(user, reason))
    this.sekshi.lockskipDJ(this.sekshi.getCurrentDJ().id, this.options.lockskipPos)
  }

}