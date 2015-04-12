const debug = require('debug')('sekshi:history-skip')
const SekshiModule = require('../Module')

export default class HistorySkip extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Autoskip songs that have been played recently.'

    this._skipping = false

    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      limit: 50
    }
  }

  init() {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    this.sekshi.getRoomHistory((e, history) => {
      if (e) return debug('error loading history', e)
      if (history.slice(0, this.options.limit)
                 .some(item => item.media.format === media.format && item.media.cid === media.cid)) {
        let dj = this.sekshi.getCurrentDJ()
        this.sekshi.onMessage({
          id: 'sekshi',
          message: `!lockskip history`
        })
      }
    })
  }

}