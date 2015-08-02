const random = require('random-item')
const debug = require('debug')('sekshi:greeting')
const SekshiModule = require('../Module')

export default class Greetings extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.description = 'Greets users.'

    this.greet = this.greet.bind(this)
  }

  defaultOptions() {
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

  init() {
    this.lastGreeted = -1
    this.sekshi.on(this.sekshi.USER_JOIN, this.greet)
    this.sekshi.on(this.sekshi.FRIEND_JOIN, this.greet)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.greet)
    this.sekshi.removeListener(this.sekshi.FRIEND_JOIN, this.greet)
  }

  greet(user) {
    if (this.lastGreeted == user.id ||
        user.username === this.sekshi.getSelf().username ||
        // guest users
        user.username == '') {
      return
    }

    let { greetings, emoji } = this.options
    this.lastGreeted = user.id

    let greeting = random(greetings)
    let message = greeting.replace(/@/g, `@${user.username}`)
                + (this.sekshi.isFriend(user.id) ? ` ${random(emoji)}` : '')
    setTimeout(() => {
      this.sekshi.sendChat(message)
    }, 2 * 1000)
  }
}
