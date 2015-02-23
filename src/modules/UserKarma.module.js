const debug = require('debug')('sekshi:karma')
const assign = require('object-assign')
const { User } = require('../models')
const SekshiModule = require('../Module')

export default class UserKarma extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'brookiebeast'
    this.version = '0.1.1'
    this.description = 'Keeps track of users\' earned internet points.'

    super(sekshi, options)

    this.permissions = {
      karma: sekshi.USERROLE.NONE,
      bump: sekshi.USERROLE.NONE,
      thump: sekshi.USERROLE.NONE
    }
  }

  karma(user, username) {
    if (username && username.charAt(0) === '@') username = username.slice(1)
    if (username) {
      let other = this.sekshi.getUserByName(username, true)
      User.findById(other.id).exec()
      .then(usar => {
        if (!usar) {
          debug('No one to Karma')
          this.sekshi.sendChat(`@${user.username} I don't know ${username} yet`)
          return undefined
        }
        let karma = usar.get('karma')
        debug('current karma', usar.get('karma'))
        this.sekshi.sendChat(`@${user.username} ${username}\'s karma is ${karma}`)
        return usar
      })
    } else {
      User.findById(user.id).exec()
      .then(usar => {
        if (!usar) {
          debug('No one to Karma')
          this.sekshi.sendChat(`@${user.username} Who are you?`)
          return undefined
        }
        let karma = usar.get('karma')
        debug('current karma', usar.get('karma'))
        this.sekshi.sendChat(`@${user.username} Your karma is ${karma}`)
        return usar
      })
    }
  }

  bump(user, username) {
    if (!username) {
      debug('karma bump no username')
      this.sekshi.sendChat(`@${user.username} You must provide a user to bump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = this.sekshi.getUserByName(username, true)
    if (!other) {
      debug('karma bump user doesn\'t exist')
      this.sekshi.sendChat(`@${user.username} That's not a real person`)
      return
    }
    if (other.id === user.id) {
      debug('karma bump on self')
      this.sekshi.sendChat(`@${user.username} Nice try, smartass`)
      return
    }

    debug('karma bump', `${other.username} (${other.id})`)
    User.fromPlugUser(other).then(target => {
      if (target) {
        return target.set('karma', target.get('karma') + 1).save()
      }
    })
  }

  thump(user, username) {
    if (!username) {
      debug('karma thump no username')
      this.sekshi.sendChat(`@${user.username} You must provide a user to thump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = this.sekshi.getUserByName(username, true)
    if (!other) {
      debug('karma thump user doesn\'t exist')
      this.sekshi.sendChat(`@${user.username} That's not even a real person`)
      return
    }
    if (other.id === user.id) {
      debug('karma thump on self')
      this.sekshi.sendChat(`@${user.username} Whatever you want man`)
    }

    debug('karma thump', `${other.username} (${other.id})`)
    User.fromPlugUser(other).then(target => {
      if (target) {
        return target.set('karma', target.get('karma') - 1).save()
      }
    })
  }
}