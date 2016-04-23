import { Module } from '../'

export default class SongLengthSkip extends Module {
  author = 'ReAnna'
  description = 'Autoskip songs that are too long.'

  defaultOptions () {
    return {
      limit: 7 * 60
    }
  }

  init () {
    this._skipping = false
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }

  destroy () {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance = (booth, { media }) => {
    const source = null // TODO get source somehow
    if (media.duration > this.options.limit) {
      let seconds = this.options.limit % 60
      let formatted = `${Math.floor(this.options.limit / 60)}:${seconds < 10 ? `0${seconds}` : seconds}`
      // TODO get something nicer than this ):
      const modSkip = this.bot.getPlugin('modskip')
      modSkip.lockskip(
        source.getSelf(),
        `This song is longer than the maximum of ${formatted}. Please pick a shorter one.`
      )
    }
  }
}
