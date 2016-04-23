import { Module } from '../../'
import Vote from '../../models/Vote'

export default class WLKAutoAchievements extends Module {
  author = 'WE ♥ KPOP'
  description = 'Some automated achievements for WE ♥ KPOP.'

  constructor (bot, options) {
    super(bot, options)

    this.onVote = this.onVote.bind(this)
    this.onGrab = this.onGrab.bind(this)
  }

  init () {
    this.achievements = this.bot.getPlugin('achievements')
    if (!this.achievements || !this.achievements.enabled()) {
      this.bot.sendChat(
        '@staff The Achievements plugin must be enabled for the ' +
        'WLK/AutoAchievements plugin to work.'
      )
      return this.disable()
    }

    this.bot.on(this.bot.VOTE, this.onVote)
    this.bot.on(this.bot.GRAB_UPDATE, this.onGrab)
  }

  destroy () {
    this.bot.removeListener(this.bot.VOTE, this.onVote)
    this.bot.removeListener(this.bot.GRAB_UPDATE, this.onGrab)
  }

  give (user, name) {
    if (typeof user === 'object') {
      user = user.id
    }
    if (user) {
      this.achievements.unlockAchievement(user, name).then((unlock) => {
        if (unlock) {
          unlock.set('giver', this.bot.getSelf().id).save()
          return this.achievements.notifyUnlocked(unlock)
        }
      })
    }
  }

  onVote (vote) {
    const dj = this.bot.getCurrentDJ()
    const votes = this.bot.getVotes()
    const negative = votes.filter((v) => v.direction === -1).length
    // bad choice
    if (negative === 4) this.give(dj, 'badchoice')

    Vote.count({ user: vote.id }).then((c) => {
      if (c > 10000) this.give(vote.id, 'wootthefuck')
    })
  }

  onGrab () {
    const dj = this.bot.getCurrentDJ()
    // grabd
    if (this.bot.getGrabs().length === 5) this.give(dj, 'grabd')
    // exquisite
    if (this.bot.getGrabs().length === 10) this.give(dj, 'exquisite')
    // producer
    if (this.bot.getGrabs().length === 20) this.give(dj, 'producer')
  }
}
