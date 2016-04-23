import { Module } from '../'

export default class StuckSkip extends Module {
  author = 'ReAnna'
  description = 'Skips songs when plug.dj forgets to push advance messages.'

  source = this.adapter('plugdj').getChannel('main')

  defaultOptions () {
    return {
      delay: 3.0
    }
  }

  init () {
    this.source.on('advance', this.onAdvance)
  }

  destroy () {
    clearTimeout(this._timer)
    this.source.removeListener('advance', this.onAdvance)
  }

  onAdvance = (booth, { media }, previous) => {
    clearTimeout(this._timer)
    if (media && media.cid) {
      let delay = parseFloat(this.options.delay)
      this._timer = setTimeout(this._skip, (media.duration + delay) * 1000)
    }
  }

  _skip = () => {
    this.source.send('/me Song stuck, skipping...', 5000)
    this.source.skipDJ(this.source.getCurrentDJ().id)
  }
}
