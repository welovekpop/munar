import { Module } from '../'

const debug = require('debug')('sekshi:auto-friend')

export default class AutoFriend extends Module {
  author = 'ReAnna'
  description = 'Just wants to be friends with everyone.'

  constructor (bot, options) {
    super(bot, options)

    this.onRequest = this.onRequest.bind(this)
    bot.on(bot.FRIEND_REQUEST, this.onRequest)
  }

  destroy () {
    this.bot.removeListener(this.bot.FRIEND_REQUEST, this.onRequest)
  }

  onRequest (user) {
    debug('new request', user.username)
    this.bot.addFriend(user.id, (e) => {
      if (e) debug('friend error', e)
      else debug('added friend')
    })
  }

}
