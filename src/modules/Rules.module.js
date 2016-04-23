import { Module, command } from '../'

export default class Rules extends Module {
  author = 'ReAnna'
  description = 'Adds a !rule command that tells people specific rules from the room description.'

  defaultOptions () {
    return {
      url: 'https://my-room-website.com/rules'
    }
  }

  @command('rule', { role: command.ROLE.RESIDENTDJ })
  rule (message, n, targetName = null) {
    const descr = this.bot.getDescription()
    const rx = new RegExp(`^${n}. `)
    const rule = descr.split('\n').find((line) => rx.test(line))

    if (!rule) {
      message.reply('I don\'t know that rule…')
      return
    }

    let targetPing = ''
    if (targetName) {
      const target = message.source.getUserByName(targetName)
      targetPing = target ? `@${target.username}` : targetName
    }
    message.send(`${targetPing} ${rule} ${this.options.url}`)
  }
}
