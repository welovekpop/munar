const debug = require('debug')('sekshi:history-skip')
const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class HistorySkip extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'HistorySkip'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Autoskip songs that have been played recently.'

    super(sekshi, options)

    this._skipping = false

    this.onAdvance = this.onAdvance.bind(this)
    sekshi.on(sekshi.ADVANCE, this.onAdvance)
  }

  defaultOptions() {
    return {
      limit: 50
    }
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