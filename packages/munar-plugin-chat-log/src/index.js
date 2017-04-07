import { Plugin, command } from 'munar-core'

import moment from 'moment'

export default class ChatLog extends Plugin {
  static description = 'Logs chat messages.'

  constructor (bot, options) {
    super(bot, options)

    this.onChat = this.onChat.bind(this)
  }

  enable () {
    this.bot.on('message', this.onChat)
  }

  disable () {
    this.bot.removeListener('message', this.onChat)
  }

  @command('lastspoke', {
    description: 'Show the last time a user said something.',
    arguments: [ command.arg.user() ]
  })
  async showLastSpoke (message, targetName) {
    const ChatMessage = this.bot.model('ChatMessage')

    const adapter = message.source.getAdapterName()
    try {
      const target = await this.bot.findUser(targetName, { adapter: adapter })
      if (!target) {
        message.reply('Could not find a user by that name.')
        return
      }
      const [msg] = await ChatMessage.find({ user: target })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .limit(1)
      const time = moment(msg.createdAt)
      message.reply(
        `${target.username} last uttered a word on ` +
        `${time.format('LL [at] LT')} (${time.fromNow()}).`
      )
    } catch (e) {
      message.reply(`I haven't seen ${targetName} speak.`)
    }
  }

  async onChat (message) {
    const User = this.bot.model('User')
    const ChatMessage = this.bot.model('ChatMessage')

    try {
      const user = await User.from(message.user)
      const adapter = message.source.getAdapterName()
      await ChatMessage.create({
        adapter,
        sourceId: message.id,
        type: message.type || 'chat',
        user: user ? user.id : null,
        message: message.text
      })
    } catch (err) {
      console.error(err.stack)
    }
  }
}
