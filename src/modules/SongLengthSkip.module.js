const debug = require('debug')('sekshi:vote-skip')
const assign = require('object-assign')

export default class SongLengthSkip {

  constructor(sekshi, options = {}) {
    this.name = 'Song Length Skip'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Autoskip songs that are too long.'

    this.sekshi = sekshi
    this.options = assign({
      limit: 7 * 60
    }, options)

    this.permissions = {}

    this._skipping = false

    this.onAdvance = this.onAdvance.bind(this)
    sekshi.on(sekshi.ADVANCE, this.onAdvance)
  }

  destroy() {
    this.sekshi.off(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    if (media.duration > this.options.limit) {
      let seconds = this.options.limit % 60
      let formatted = `${Math.floor(this.options.limit / 60)} ${seconds < 10 ? `0${seconds}` : seconds}`
      // TODO get something nicer than this ):
      this.sekshi.onMessage({
        message: `!lockskip "This song is longer than the maximum of ${formatted}. Please pick a shorter one."`,
        id: 'sekshi'
      })
    }
  }

}