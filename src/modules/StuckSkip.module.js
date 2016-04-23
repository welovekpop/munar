import { Module } from '../'

export default class StuckSkip extends Module {
  author = 'ReAnna'
  description = 'Skips songs when plug.dj forgets to push advance messages.'

  defaultOptions () {
    return {
      delay: 3.0
    }
  }

  init () {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }

  destroy () {
    clearTimeout(this._timer)
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance = (booth, { media }, previous) => {
    clearTimeout(this._timer)
    if (media && media.cid) {
      let delay = parseFloat(this.options.delay)
      this._timer = setTimeout(this._skip, (media.duration + delay) * 1000)
    }
  }

  _skip = () => {
    this.sekshi.sendChat('/me Song stuck, skipping...', 5000)
    this.sekshi.skipDJ(this.sekshi.getCurrentDJ().id)
  }
}
