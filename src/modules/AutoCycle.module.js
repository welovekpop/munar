const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:autocycle')

export default class AutoCycle extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '1.0.0'
    this.description = 'Automatically enables/disables DJ cycle when the wait list is long.'

    this.onUpdate = this.onUpdate.bind(this)
  }

  defaultOptions() {
    return {
      cycle: 27,
      uncycle: 35
    }
  }

  init() {
    this.sekshi.on(this.sekshi.WAITLIST_UPDATE, this.onUpdate)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.WAITLIST_UPDATE, this.onUpdate)
  }

  onUpdate(_, waitlist) {
    let length = waitlist.length
    let cycle = this.sekshi.doesWaitlistCycle()
    debug('cycle', cycle, length, this.options.cycle, this.options.uncycle)
    if (cycle && length >= this.options.uncycle) {
      this.sekshi.setCycle(false, () => {
        this.sekshi.sendChat(`@djs DJ Cycle is disabled because of the long wait list. ` +
                             `Remember to rejoin the waitlist after your play!`)
      })
    }
    else if (!cycle && length <= this.options.cycle) {
      this.sekshi.setCycle(true)
    }
  }

}
