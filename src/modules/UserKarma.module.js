const debug = require('debug')('sekshi:karma')
const assign = require('object-assign')
const { User } = require('../models')
const SekshiModule = require('../Module')

export default class UserKarma extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'brookiebeast'
    this.version = '0.1.2'
    this.description = 'Keeps track of users\' earned internet points.'

    super(sekshi, options)

    this.permissions = {
      karma: sekshi.USERROLE.NONE,
      karmawhores: sekshi.USERROLE.NONE,
      bump: sekshi.USERROLE.NONE,
      thump: sekshi.USERROLE.NONE
    }
  }

  karma(user, username) {
    if (username && username.charAt(0) === '@') username = username.slice(1)
    if (username) {
      // let other = this.sekshi.getUserByName(username, true)
      User.findOne({ username }).exec()
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

  karmawhores(user) {
    User.find().sort({karma:-1}).limit(5).exec().then(userlist => {
      this.sekshi.sendChat(`@${user.username} Karma Leaderboard:`)
      var rank = 0;
      for (var i = 0; i < userlist.length; ++i) {
        this.sekshi.sendChat(`${++rank} - ${userlist[i].username} : ${userlist[i].karma}`)
      };
    })
  }

  bump(user, username, ...reason) {
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
        if (reason) {
          this.sekshi.sendChat(`@${user.username} bumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          this.sekshi.sendChat(`@${user.username} bumped @${other.username}\'s karma!`)
        }
        return target.set('karma', target.get('karma') + 1).save()
      }
    })
  }

  thump(user, username, ...reason) {
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
        if (reason) {
          this.sekshi.sendChat(`@${user.username} thumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          this.sekshi.sendChat(`@${user.username} thumped @${other.username}\'s karma!`)
        }
        return target.set('karma', target.get('karma') - 1).save()
      }
    })
  }
}