const debug = require('debug')('sekshi:vote-skip')
const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class VoteSkip extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Autoskip songs after a number of mehs.'

    super(sekshi, options)

    this.onVote = this.onVote.bind(this)
    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      limit: 7
    }
  }

  init() {
    this._skipping = false

    this.sekshi.on(this.sekshi.VOTE, this.onVote)
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.VOTE, this.onVote)
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance() {
    this._skipping = false
  }

  onVote() {
    let mehs = 0
    let votesMap = this.sekshi.getVotes()
      .reduce((map, { id, direction }) => (map[id] = direction, map), {})
    for (let uid in votesMap) if (votesMap.hasOwnProperty(uid)) {
      if (votesMap[uid] === -1) mehs++
    }

    if (mehs >= this.options.limit && !this._skipping) {
      this.sekshi.sendChat(`/me ${mehs} people voted to skip!`)
      this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id)
      this._skipping = true
    }
  }

}