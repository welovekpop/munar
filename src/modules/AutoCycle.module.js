import { Module } from '../'

const debug = require('debug')('sekshi:autocycle')

export default class AutoCycle extends Module {
  author = 'ReAnna'
  description = 'Automatically enables/disables DJ cycle when the wait list is long.'

  source = this.adapter('uwave').getChannel('main')

  defaultOptions () {
    return {
      cycle: 27,
      uncycle: 35
    }
  }

  init () {
    this.source.on('waitlist:update', this.onUpdate)
  }

  destroy () {
    this.sekshi.removeListener('waitlist:update', this.onUpdate)
  }

  onUpdate = (waitlist) => {
    const length = waitlist.length
    const cycle = this.sekshi.doesWaitlistCycle()
    debug('cycle', cycle, length, this.options.cycle, this.options.uncycle)
    if (cycle && length >= this.options.uncycle) {
      this.sekshi.setCycle(false, () => {
        this.sekshi.sendChat(
          '@djs DJ Cycle is disabled because of the long wait list. ' +
          'Remember to rejoin the waitlist after your play!'
        )
      })
    } else if (!cycle && length <= this.options.cycle) {
      this.sekshi.setCycle(true)
    }
  }
}
