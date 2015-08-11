const SekshiModule = require('../Module')
const { ChatMessage } = require('../models')
const { emojiAliases } = require('../utils')
const replace = require('replaceall')

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

  isEmote(message) {
    let start = message.slice(0, 4)
    return start === '/me ' || start === '/em '
  }

  getType(message) {
    return this.isEmote(message) ? 'emote' : 'message'
  }

  getEmoji(message) {
    Object.keys(emojiAliases).forEach(emote => {
      message = replace(emote, `:${emojiAliases[emote]}:`, message)
    })
    return message.match(/:([^ :]+):/g) || []
  }

  getMentions(message) {
    return this.sekshi.getUsers()
      .filter(user => message.indexOf(`@${user.username}`) !== -1)
  }

  onChat(message) {
    let cm = new ChatMessage({
      _id: message.cid,
      type: this.getType(message.message),
      user: message.id,
      message: message.message,
      emoji: this.getEmoji(message.message),
      mentions: this.getMentions(message.message).map(user => user.id)
    })
    cm.save()
      .then(cm => { /* cool */ })
      .catch(e => { console.error(e) })
  }
}
