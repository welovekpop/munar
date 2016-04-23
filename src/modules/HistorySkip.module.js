import { Module } from '../'

const debug = require('debug')('sekshi:history-skip')

export default class HistorySkip extends Module {
  author = 'ReAnna'
  description = 'Autoskip songs that have been played recently.'

  // counts subsequent skips per user. if a user is history-skipped three
  // times or more, they are removed from the waitlist.
  // (see options.autoremove)
  _skipCount = {}

  defaultOptions () {
    return {
      limit: 50,
      autoremove: 3
    }
  }

  init () {
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }
  destroy () {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance = (booth, { media }) => {
    let dj = this.bot.getCurrentDJ()
    const modSkip = this.bot.getPlugin('modskip')

    // nobody is playing anymore, or the skip plugin is
    // not loaded
    if (!dj || !modSkip) return

    this.bot.getRoomHistory((e, history) => {
      if (e) return debug('error loading history', e)
      const shouldSkip = history
        .slice(0, this.options.limit)
        .some((item) => item.media.format === media.format && item.media.cid === media.cid)
      if (shouldSkip) {
        this._skipCount[dj.id] = (this._skipCount[dj.id] || 0) + 1
        if (this._skipCount[dj.id] >= this.options.autoremove) {
          this.bot.sendChat(modSkip.getSkipMessage('history'))
          this.bot.removeDJ(dj.id)
        } else {
          modSkip.lockskip(this.bot.getSelf(), 'history')
        }
      } else {
        delete this._skipCount[dj.id]
      }
    })
  }
}
