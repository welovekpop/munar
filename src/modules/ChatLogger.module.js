const SekshiModule = require('../Module')
const command = require('../command')
const ChatMessage = require('../models/ChatMessage')
const { emojiAliases } = require('../utils')
const moment = require('moment')
const quote = require('regexp-quote')

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

  @command('lastspoke')
  showLastSpoke(user, ...nameParts) {
    const targetName = nameParts.join(' ')
    this.sekshi.findUser(targetName)
      .then(target => {
        return ChatMessage.find({ user: target.id }).sort({ time: -1 }).limit(1)
          .then(([ msg ]) => {
            let time = moment(msg.time)
            this.sekshi.sendChat(
              `@${user.username} ${target.username} last uttered a word on ` +
              `${time.format('LL [at] LT')} (${time.fromNow()}).`
            )
          })
      })
      .catch(e => {
        this.sekshi.sendChat(`@${user.username} I haven't seen ${targetName} speak.`)
      })
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
      message = message.replace(new RegExp(`(\\s|^)(${quote(emote)})(?=\\s|$)`, 'g'), `$1:${emojiAliases[emote]}:`)
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
