import { Module, command } from '../'
import ChatMessage from '../models/ChatMessage'
import User from '../models/User'
import { emojiAliases } from '../utils'

import emoji from 'js-emoji'
import moment from 'moment'

export default class ChatLogger extends Module {
  author = 'ReAnna'
  description = 'Logs chat messages.'

  constructor (bot, options) {
    super(bot, options)

    this.onChat = this.onChat.bind(this)
  }

  init () {
    this.bot.on('message', this.onChat)

    emoji.emoticons_data = emojiAliases
  }

  destroy () {
    this.bot.removeListener('message', this.onChat)
  }

  @command('lastspoke')
  async showLastSpoke (message, ...nameParts) {
    const targetName = nameParts.join(' ')
    try {
      const target = await this.bot.findUser(targetName)
      const [msg] = await ChatMessage.find({ user: target.id }).sort({ time: -1 }).limit(1)
      const time = moment(msg.time)
      message.reply(
        `${target.username} last uttered a word on ` +
        `${time.format('LL [at] LT')} (${time.fromNow()}).`
      )
    } catch (e) {
      message.reply(`I haven't seen ${targetName} speak.`)
    }
  }

  isEmote (message) {
    const start = message.slice(0, 4)
    return start === '/me ' || start === '/em '
  }

  getType (message) {
    return this.isEmote(message) ? 'emote' : 'message'
  }

  getEmoji (message) {
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

  async onChat (message) {
    const user = await User.from(message.user)

    const cm = new ChatMessage({
      _id: message.id,
      type: this.getType(message.text),
      user: user ? user.id : null,
      message: message.text,
      emoji: this.getEmoji(message.text),
      mentions: this.getMentions(message)
        .map((mention) => mention.id)
    })

    await cm.save()
  }
}
