import { Module } from '../'
import random from 'random-item'

export default class Greetings extends Module {
  author = 'Sooyou'
  description = 'Greets users.'

  defaultOptions () {
    return {
      greetings: [
        'Hai @',
        'Welcome, @!',
        'hoi @',
        'Heyho @',
        'Hej @',
        '안녕, @!',
        'Hi @',
        '你好, @!',
        'こんにちは, @!'
      ],
      emoji: [
        ':purple_heart:',
        ':blue_heart:',
        ':v:'
      ]
    }
  }

  init () {
    this.lastGreeted = -1
    this.sekshi.on('user:join', this.greet)
  }

  destroy () {
    this.sekshi.removeListener('user:join', this.greet)
  }

  greet = (user) => {
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
      user.source.send(message)
    }, 2 * 1000)
  }
}
