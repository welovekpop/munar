import { Plugin } from 'munar-core'
import random from 'random-item'

export default class Greetings extends Plugin {
  static description = 'Greets users.'

  static defaultOptions = {
    greetings: [
      'Welcome, @!',
      'Hi @'
    ],
    emoji: [
      ':smile:',
      ':wave:',
      ':v:'
    ]
  }

  enable () {
    this.lastGreeted = -1
    this.bot.on('user:join', this.greet)
  }

  disable () {
    this.bot.removeListener('user:join', this.greet)
  }

  greet = (source, user) => {
    if (this.lastGreeted === user.id ||
        // guest users
        user.username === '') {
      return
    }

    this.lastGreeted = user.id

    const greeting = random(this.options.greetings)
    const message = greeting.replace(/@/g, `@${user.username}`) +
      ` ${random(this.options.emoji)}`
    setTimeout(() => {
      source.send(message)
    }, 2 * 1000)
  }
}
