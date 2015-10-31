const autobind = require('autobind-decorator')
const SekshiModule = require('../Module')

export default class AntiSpam extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Auto-deletes messages.'
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

  @autobind
  onMessage(message) {
    if (this.options.afk && this.isAFK(message.text) ||
        this.options.spam && this.isSpam(message.text)) {
      message.delete()
    }
  }

}
