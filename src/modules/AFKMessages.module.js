const SekshiModule = require('../Module')

export default class AFKMessages extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Auto-deletes AFK autoresponder messages.'

    this.onMessage = this.onMessage.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.CHAT, this.onMessage)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.CHAT, this.onMessage)
  }

  onMessage(message) {
    if (message.message.indexOf('[AFK] ') === 0) {
      this.sekshi.deleteMessage(message.cid)
    }
  }

}
