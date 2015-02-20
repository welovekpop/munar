const assign = require('object-assign')

export default class ModSkip {

  constructor(sekshi, options = {}) {
    this.name = 'ModSkip'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Simple DJ skipping tools'

    this.sekshi = sekshi
    this.options = assign({
      reasons: {
        kpop: 'This is a Korean music dedicated room, please only play music by Korean artists.',
        history: 'This song is in the history. Please pick another.'
      },
      lockskipPos: 1
    }, options)

    this.permissions = {
      skip: sekshi.USERROLE.BOUNCER,
      lockskip: sekshi.USERROLE.BOUNCER
    }
  }

  _skipMessage(user, reason) {
    if (this.options.reasons.hasOwnProperty(reason)) {
      let dj = this.sekshi.getCurrentDJ()
      return `@${dj.username} ${this.options.reasons[reason]}`
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
    this.sekshi.skipDJ(id, () => {
      this.sekshi.moveDJ(id, this.options.lockskipPos)
    })
  }

}