const debug = require('debug')('sekshi:user-logging')
const assign = require('object-assign')
const { User } = require('../models')

export default class UserLogger {

  constructor(sekshi, options = {}) {
    this.name = 'User Logger'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Keeps track of users who visit the channel.'

    this.sekshi = sekshi
    this.options = assign({
      // no options :D
    }, options)

    // sigh…
    this.onUserJoin = this.onUserJoin.bind(this)
    sekshi.on(sekshi.USER_JOIN, this.onUserJoin)
  }

  destroy() {
    sekshi.off(sekshi.USER_JOIN, this.onUserJoin)
  }

  onUserJoin(user) {
    debug('join', `${user.username} (${user.id})`)
    const descr = {
      _id: user.id
    , username: user.username
    , slug: user.slug
    , level: user.level
    , role: user.role
    , gRole: user.gRole
    , joined: new Date(user.joined)
    , avatar: user.avatarID
    , badge: user.badge
    , lastVisit: new Date()
    }
    User.findById(user.id).exec()
      .then(user => {
        if (!user) {
          debug('new user', descr.username)
          return User.create(descr)
        }
        debug('returning user', user.username)
        user.set('visits', user.get('visits') + 1)
        return user.set(descr).save()
      })
  }
}