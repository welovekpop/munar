const SekshiModule = require('../Module')

export default class Emotes extends SekshiModule {
  constructor(sekshi, options) {
    this.name = 'Emotes'
    this.author = 'Sooyou'
    this.version = '0.2.0'
    this.description = 'adds several emoticons as well as gifs and webms'

    super(sekshi, options)

    this.permissions = {
      thatsnono: sekshi.USERROLE.NONE
    }
  }

  sendEmote(msg, username) {
    if (username) {
      let user = this.sekshi.getUserByName(username, true)
      if (user) {
        this.sekshi.sendChat(`@${user.username} ${msg}`)
        return
      }
    }
    this.sekshi.sendChat(msg)
  }

  thatsnono(user, username) {
    if (username && username.charAt(0) === '@') username = username.slice(1)
    this.sendEmote('That\'s no no http://a.pomf.se/lcmeuw.webm', username)
  }
}