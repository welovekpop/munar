const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:auto-friend')

export default class AutoFriend extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Just wants to be friends with everyone.'

    this.onRequest = this.onRequest.bind(this)
    sekshi.on(sekshi.FRIEND_REQUEST, this.onRequest)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.FRIEND_REQUEST, this.onRequest)
  }

  onRequest(user) {
    debug('new request', user.username)
    this.sekshi.addFriend(user.id, e => {
      if (e) debug('friend error', e)
      else debug('added friend')
    })
  }

}