const debug = require('debug')('sekshi:greeting')
const SekshiModule = require('../Module')

export default class Greetings extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'Sooyou'
    this.version = '0.1.0'
    this.description = 'Greets users.'

    this.permissions = {
      greetusers: sekshi.USERROLE.BOUNCER
    }

    this.greet = this.greet.bind(this)
  }

  defaultOptions() {
    return {
      autogreet: true,
      greetings: [
        'Hai @',
        'Welcome, @!',
        'hoi @',
        'Heyho @',
        'Hej @',
        '안녕, @!',
        'Hi @'
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

  greetusers(toggle) {
    this.options.autogreet = (toggle.toLowerCase() === 'true' ? true : false)
  }

  greet(user) {
    if (!this.options.autogreet ||
        this.lastGreeted == user.id ||
        user.username === this.sekshi.getSelf().username) {
      return
    }

    let { greetings, emoji } = this.options
    this.lastGreeted = user.id

    let greeting = greetings[Math.floor(greetings.length * Math.random())]
    let message = greeting.replace(/@/, `@${user.username}`)
                + (this.sekshi.isFriend(user.id) ? ' ' + emoji[Math.floor(emoji.length * Math.random())] : '')
    setTimeout(this.sekshi.sendChat.bind(this.sekshi, message), 2 * 1000)
  }
}