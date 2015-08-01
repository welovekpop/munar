const debug = require('debug')('sekshi:user-logging')
const assign = require('object-assign')
const { User } = require('../models')
const SekshiModule = require('../Module')
const Promise = require('bluebird')

export default class UserLogger extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Keeps track of users who visit the channel.'

    this.onUserJoin = this.onUserJoin.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.USER_JOIN, this.onUserJoin)
    this.sekshi.on(this.sekshi.JOINED_ROOM, () => {
      // ensure that users who are already online are entered into the
      // database
      Promise.all(this.sekshi.getUsers().map(User.fromPlugUser))
        .then(users => { debug('updated users', users.length) })
    })
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.onUserJoin)
  }

  onUserJoin(user) {
    debug('join', `${user.username} (${user.id})`)
    User.fromPlugUser(user).then(user => {
      user.set('visits', user.get('visits') + 1)
      user.set('lastVisit', new Date())
      return user.save()
    })
  }
}
