import { Module, command } from '../'
import ChatMessage from '../models/ChatMessage'
import { emojiAliases } from '../utils'

import emoji from 'js-emoji'
import moment from 'moment'
import quote from 'regexp-quote'

export default class ChatLogger extends Module {
  author = 'ReAnna'
  description = 'Logs chat messages.'

  init () {
    this.bot.on('message', this.onChat)

    emoji.emoticons_data = emojiAliases
  }

  destroy () {
    this.bot.removeListener('message', this.onChat)
  }

  @command('lastspoke')
  showLastSpoke (message, ...nameParts) {
    const targetName = nameParts.join(' ')
    this.bot.findUser(targetName)
      .then(target => {
        return ChatMessage.find({ user: target.id }).sort({ time: -1 }).limit(1)
          .then(([ msg ]) => {
            let time = moment(msg.time)
            message.reply(
              `${target.username} last uttered a word on ` +
              `${time.format('LL [at] LT')} (${time.fromNow()}).`
            )
          })
      })
      .catch(e => {
        message.reply(`I haven't seen ${targetName} speak.`)
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
    emoji.colons_mode = true
    message = emoji.replace_emoticons_with_colons(message)
    message = emoji.replace_colons(message)
    message = emoji.replace_unified(message)
    return message.match(/:([^ :]+):/g) || []
  }

  getMentions (message) {
    return message.source.getUsers()
      .filter((user) => message.text.indexOf(`@${user.username}`) !== -1)
  }

  onChat = (message) => {
    const { user } = message
    let cm = new ChatMessage({
      _id: message.id,
      type: this.getType(message.text),
      user: user ? user.id : null,
      message: message.text,
      emoji: this.getEmoji(message.text),
      mentions: this.getMentions(message)
        .map((mention) => mention.id)
    })
    cm.save()
      .then(cm => { /* cool */ })
      .catch(e => { console.error(e) })
  }
}
