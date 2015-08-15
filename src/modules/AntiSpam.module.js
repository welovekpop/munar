const SekshiModule = require('../Module')

export default class AntiSpam extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Auto-deletes messages.'

    this.onMessage = this.onMessage.bind(this)
  }

  defaultOptions() {
    return {
      afk: true,
      spam: true
    }
  }

  init() {
    this.sekshi.on(this.sekshi.CHAT, this.onMessage)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.CHAT, this.onMessage)
  }

  onMessage(message) {
    if (this.options.afk && message.message.indexOf('[AFK] ') === 0 ||
        this.options.spam && message.message.indexOf('//adf.ly') > -1) {
      this.sekshi.deleteMessage(message.cid)
    }
  }

}
