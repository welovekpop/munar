import { Module } from '../'

export default class AntiSpam extends Module {
  author = 'ReAnna'
  description = 'Auto-deletes messages.'

  constructor(sekshi, options) {
    super(sekshi, options)
  }

  defaultOptions() {
    return {
      afk: true,
      spam: true
    }
  }

  init() {
    this.sekshi.on('message', this.onMessage)
  }

  destroy() {
    this.sekshi.removeListener('message', this.onMessage)
  }

  isAFK(message) {
    return message.indexOf('[AFK] ') === 0 ||
      /^@(.*?) \[AFK\] /.test(message)
  }

  isSpam(message) {
    return message.indexOf('//adf.ly') > -1
  }

  onMessage = (message) => {
    if (this.options.afk && this.isAFK(message.text) ||
        this.options.spam && this.isSpam(message.text)) {
      message.delete()
    }
  }
}
