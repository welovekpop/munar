const SekshiModule = require('../Module')

export default class Overplayed extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Notifies staff of overplayed tracks.'

    super(sekshi, options)

    this.onAdvance = this.onAdvance.bind(this)

    this.permissions = {}
  }

  defaultOptions() {
    return {
      span: 3,
      maxPlays: 8
    }
  }

  init() {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance() {
    const media = this.sekshi.getCurrentMedia()
    const stats = this.sekshi.getModule('MediaStats')

    if (stats && media) {
      stats.getRecentPlays(media, this.options.span * 24).then(
        plays => {
          if (plays.length >= this.options.maxPlays) {
            // hax :X
            stats.playcount({ username: 'staff' }, this.options.span * 24)
          }
        }
      )
      .then(null, e => { console.error(e) })
    }
  }
}