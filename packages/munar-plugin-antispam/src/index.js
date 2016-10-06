import { Plugin } from 'munar-core'

export default class AntiSpam extends Plugin {
  static description = 'Auto-deletes messages.'

  static defaultOptions = {
    afk: true,
    spam: true
  }

  enable () {
    this.bot.on('message', this.onMessage)
  }

  disable () {
    this.bot.removeListener('message', this.onMessage)
  }

  isAFK (message) {
    return message.indexOf('[AFK] ') === 0 ||
      /^@(.*?) \[AFK\] /.test(message)
  }

  isSpam (message) {
    return message.indexOf('//adf.ly') > -1
  }

  onMessage = (message) => {
    if (this.options.afk && this.isAFK(message.text) ||
        this.options.spam && this.isSpam(message.text)) {
      message.delete()
    }
  }
}
