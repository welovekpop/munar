import { Module } from '../../'
import Vote from '../../models/Vote'

export default class WLKAutoAchievements extends Module {
  author = 'WE ♥ KPOP'
  description = 'Some automated achievements for WE ♥ KPOP.'

  constructor (sekshi, options) {
    super(sekshi, options)

    this.onVote = this.onVote.bind(this)
    this.onGrab = this.onGrab.bind(this)
  }

  init () {
    this.achievements = this.sekshi.getModule('achievements')
    if (!this.achievements || !this.achievements.enabled()) {
      this.sekshi.sendChat(
        '@staff The Achievements module must be enabled for the ' +
        'WLK/AutoAchievements module to work.'
      )
      return this.disable()
    }

    this.sekshi.on(this.sekshi.VOTE, this.onVote)
    this.sekshi.on(this.sekshi.GRAB_UPDATE, this.onGrab)
  }

  destroy () {
    this.sekshi.removeListener(this.sekshi.VOTE, this.onVote)
    this.sekshi.removeListener(this.sekshi.GRAB_UPDATE, this.onGrab)
  }

  give (user, name) {
    if (typeof user === 'object') {
      user = user.id
    }
    if (user) {
      this.achievements.unlockAchievement(user, name).then((unlock) => {
        if (unlock) {
          unlock.set('giver', this.sekshi.getSelf().id).save()
          return this.achievements.notifyUnlocked(unlock)
        }
      })
    }
  }

  onVote (vote) {
    const sekshi = this.sekshi
    const dj = sekshi.getCurrentDJ()
    const votes = sekshi.getVotes()
    const negative = votes.filter((v) => v.direction === -1).length
    // bad choice
    if (negative === 4) this.give(dj, 'badchoice')

    Vote.count({ user: vote.id }).then((c) => {
      if (c > 10000) this.give(vote.id, 'wootthefuck')
    })
  }

  onGrab () {
    const sekshi = this.sekshi
    const dj = sekshi.getCurrentDJ()
    // grabd
    if (sekshi.getGrabs().length === 5) this.give(dj, 'grabd')
    // exquisite
    if (sekshi.getGrabs().length === 10) this.give(dj, 'exquisite')
    // producer
    if (sekshi.getGrabs().length === 20) this.give(dj, 'producer')
  }
}
