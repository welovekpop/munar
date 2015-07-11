const SekshiModule = require('../Module')
const { ChatMessage } = require('../models')

export default class ChatLogger extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Logs chat messages.'

    this.onChat = this.onChat.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.CHAT, this.onChat)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.CHAT, this.onChat)
  }

  onChat(message) {
    ChatMessage.create({
      _id: message.cid,
      user: message.id,
      message: message.message
    }).then(
      cm => { /* cool */ },
      e  => { debug('cm-err', e) }
    )
  }
}
