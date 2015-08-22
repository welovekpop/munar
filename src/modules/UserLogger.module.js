const debug = require('debug')('sekshi:user-logging')
const assign = require('object-assign')
const User = require('../models/User')
const SekshiModule = require('../Module')
const Promise = require('bluebird')

export default class UserLogger extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Keeps track of users who visit the channel.'

    this.onUserJoin = this.onUserJoin.bind(this)
    this.onUserUpdate = this.onUserUpdate.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.USER_JOIN, this.onUserJoin)
    this.sekshi.on(this.sekshi.USER_UPDATE, this.onUserUpdate)
    this.sekshi.on(this.sekshi.JOINED_ROOM, () => {
      // ensure that users who are already online are entered into the
      // database
      Promise.all(this.sekshi.getUsers().map(User.fromPlugUser))
        .then(users => { debug('updated users', users.length) })
    })
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.USER_JOIN, this.onUserJoin)
    this.sekshi.removeListener(this.sekshi.USER_UPDATE, this.onUserUpdate)
  }

  onUserJoin(user) {
    debug('join', `${user.username} (${user.id})`)
    User.fromPlugUser(user).then(user => {
      user.set('visits', user.get('visits') + 1)
      user.set('lastVisit', Date.now())
      return user.save()
    })
  }

  // updates user name, avatar and level
  onUserUpdate(update) {
    const user = this.sekshi.getUserByID(update.id)
    if (!user) return
    User.findById(user.id).exec().then(model => {
      if (!model) return
      if (update.level) {
        user.level = update.level
        model.set('level', update.level)
      }
      if (update.avatarID) {
        user.avatarID = update.avatarID
        model.set('avatar', update.avatarID)
      }
      if (update.username) {
        user.username = update.username
        model.set('username', update.username)
      }
      model.save()
    })
  }
}
