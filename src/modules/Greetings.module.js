const debug = require('debug')('sekshi:greeting')
const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class Greetings extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'Greetings'
    this.author = 'Sooyou'
    this.version = '0.1.0'
    this.description = 'Greets users.'

    super(sekshi, options)
    this.permissions = {
      greetusers: sekshi.USERROLE.BOUNCER
    }

    this.autogreet = true
    this.lastGreeted = -1

    this.greet = this.greet.bind(this)
    sekshi.on(sekshi.USER_JOIN, this.greet)
    sekshi.on(sekshi.FRIEND_JOIN, this.greet)
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
        '/me hugs @'
      ],
      emoji: [
        ':purple_heart:',
        ':blue_heart:',
        ':v:'
      ]
    }
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.greet)
    this.sekshi.removeListener(this.sekshi.FRIEND_JOIN, this.greet)
  }

  greetusers(toggle) {
    this.autogreet = (toggle.toLowerCase() === 'true' ? true : false)
  }

  greet(user) {
    if (!this.autogreet ||
        this.lastGreeted == user.id ||
        user.username === this.sekshi.getSelf().username ||
        !this.sekshi.isModuleEnabled(this.name)) {
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