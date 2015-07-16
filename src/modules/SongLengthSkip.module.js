const debug = require('debug')('sekshi:vote-skip')
const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class SongLengthSkip extends SekshiModule {

  constructor(sekshi, options = {}) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Autoskip songs that are too long.'

    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      limit: 7 * 60
    }
  }

  init() {
    this._skipping = false
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    if (media.duration > this.options.limit) {
      let seconds = this.options.limit % 60
      let formatted = `${Math.floor(this.options.limit / 60)}:${seconds < 10 ? `0${seconds}` : seconds}`
      // TODO get something nicer than this ):
      this.sekshi.onMessage({
        message: `!lockskip "This song is longer than the maximum of ${formatted}. Please pick a shorter one."`,
        id: 'sekshi'
      })
    }
  }

}
