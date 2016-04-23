import { Module } from '../'

export default class VoteSkip extends Module {
  author = 'ReAnna'
  description = 'Autoskip songs after a number of mehs.'

  defaultOptions () {
    return {
      limit: 7
    }
  }

  init () {
    this._skipping = false

    this.bot.on(this.bot.VOTE, this.onVote)
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }
  destroy () {
    this.bot.removeListener(this.bot.VOTE, this.onVote)
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance = () => {
    this._skipping = false
  }

  onVote = () => {
    let mehs = 0
    let votesMap = this.bot.getVotes().reduce((map, { id, direction }) => {
      map[id] = direction
      return map
    }, {})
    for (let uid in votesMap) {
      if (votesMap.hasOwnProperty(uid) && votesMap[uid] === -1) {
        mehs++
      }
    }

    if (mehs >= this.options.limit && !this._skipping) {
      this.bot.sendChat(`/me ${mehs} people voted to skip!`)
      this.bot.skipDJ(this.bot.getCurrentDJ().id)
      this._skipping = true
    }
  }

}
