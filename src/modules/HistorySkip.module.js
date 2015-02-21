const debug = require('debug')('sekshi:history-skip')
const assign = require('object-assign')

export default class HistorySkip {

  constructor(sekshi, options = {}) {
    this.name = 'HistorySkip'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Autoskip songs that have been played recently.'

    this.sekshi = sekshi
    this.options = assign({
      limit: 50
    }, options)

    this.permissions = {}

    this._skipping = false

    this.onAdvance = this.onAdvance.bind(this)
    sekshi.on(sekshi.ADVANCE, this.onAdvance)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    this.sekshi.getRoomHistory((e, history) => {
      if (e) return debug('error loading history', e)
      if (history.some(item => item.media.format === media.format && item.media.cid === media.cid)) {
        let dj = this.sekshi.getCurrentDJ()
        this.sekshi.onMessage({
          id: 'sekshi',
          message: `!lockskip history`
        })
      }
    })
  }

}