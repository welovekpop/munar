const debug = require('debug')('sekshi:karma')
const assign = require('object-assign')
const random = require('random-item')
const { User, Karma } = require('../models')
const SekshiModule = require('../Module')
const command = require('../command')
const moment = require('moment')
const utils = require('../utils')

export default class UserKarma extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'brookiebeast'
    this.description = 'Keeps track of users\' earned internet points.'
  }

  @command('karma')
  karma(user, username, time = 'w') {
    let self = false
    if (username && /(^[dwmf]$)|(^\d+$)/.test(username)) {
      self = true
      time = username
    }
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    if (username && username.charAt(0) === '@') username = username.slice(1)
    if (!self && username) {
      User.findOne({ username })
        .then(usar => {
          if (!usar) {
            this.sekshi.sendChat(`@${user.username} I don't know ${username} yet`)
            return undefined
          }
          return Karma.find({ date: { $gte: since.toDate() }, target: usar._id })
                      .select('amount')
                      .exec()
            .then(karmaList => {
              let karma = karmaList.reduce( (a, b) => { return a + b.amount }, 0)
              let msg = `@${user.username} ${username} has ${karma} karma`
              if (!allTime) msg += ` from the past ${utils.days(hours)}`
              this.sekshi.sendChat(`${msg}.`)
            })
        })
        .catch(e => console.error(e))
    } else {
      User.findById(user.id)
        .then(usar => {
          if (!usar) {
            this.sekshi.sendChat(`@${user.username} who are you?`)
            return undefined
          }
          return Karma.find({ date: { $gte: since.toDate() }, target: usar._id })
                      .select('amount')
                      .exec()
            .then(karmaList => {
              let karma = karmaList.reduce( (a, b) => { return a + b.amount }, 0)
              let msg = `@${user.username} you have ${karma} karma`
              if (!allTime) msg += ` from the past ${utils.days(hours)}`
              this.sekshi.sendChat(`${msg}.`)
            })
        })
        .catch(e => console.error(e))
    }
  }

  @command('karmawhores')
  karmawhores(user, time = 'w') {
    // stole all this shit from !mostplayed in MediaStats
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    Karma.aggregate()
      .match({ date: { $gte: since.toDate() } })
      .group({ _id: "$target", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .limit(5)
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          this.sekshi.sendChat(`@${user.username} none of you like each other T_T`)
        }
        else {
          let karmas = {}
          karmaList.forEach(k => { karmas[k._id] = k.karma })
          return User.where('_id').in(karmaList.map(k => k._id)).lean().exec()
            .map(u => assign(u, { karma: karmas[u._id] }))
            .then(users => users.sort((a, b) => a.karma > b.karma ? -1 : 1))
            .then(users => {
              let title = `@${user.username} Karma leaders`
              if (!allTime) title += ` over the last ${utils.days(hours)}`
              this.sekshi.sendChat(`${title}:`)
              users.forEach((u, rank) => {
                this.sekshi.sendChat(`${rank + 1} - ${u.username}: ${u.karma}`)
              })
            })
        }
      })
      .catch(e => console.error(e))
  }

  @command('bump')
  bump(user, username, ...reason) {
    if (!username) {
      this.sekshi.sendChat(`@${user.username} You must provide a user to bump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = this.sekshi.getUserByName(username, true)
    if (!other) {
      this.sekshi.sendChat(`@${user.username} That's not a real person…`)
      return
    }
    if (other.id === user.id) {
      this.sekshi.sendChat(`@${user.username} Nice try, smartass!`)
      return
    }

    debug('karma bump', `${other.username} (${other.id})`)
    User.findById(other.id).exec().then(target => {
      if (target) {
        if (reason && reason.length > 0) {
          this.sekshi.sendChat(`@${user.username} bumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          this.sekshi.sendChat(`@${user.username} bumped @${other.username}\'s karma!`)
        }

        let bump = new Karma({ target: target.id, giver: user.id })
        if (reason && reason.length > 0)
          bump.reason = reason.join(' ')
        bump.save()

        return target
      }
    })
  }

  @command('thump')
  thump(user, username, ...reason) {
    if (!username) {
      debug('karma thump no username')
      this.sekshi.sendChat(`@${user.username} You must provide a user to thump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = this.sekshi.getUserByName(username, true)
    if (!other) {
      this.sekshi.sendChat(`@${user.username} That's not a real person…`)
      return
    }
    if (other.id === user.id) {
      this.sekshi.sendChat(`@${user.username} You\'re weird.`)
    }

    User.findById(other.id).exec().then(target => {
      if (target) {
        if (reason && reason.length > 0) {
          this.sekshi.sendChat(`@${user.username} thumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          this.sekshi.sendChat(`@${user.username} thumped @${other.username}\'s karma!`)
        }

        let thump = new Karma({ target: target.id, giver: user.id, amount: -1 })
        if (reason && reason.length > 0)
          thump.reason = reason.join(' ')
        thump.save()

        return target
      }
    })
  }

  @command('bitch')
  bitch(user, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    Karma.aggregate()
      .match({ target: user.id, giver: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: "$giver", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          let msg = `@${user.username} you have no bitches`
          if (!allTime) msg += ` from the past ${utils.days(hours)}`
          this.sekshi.sendChat(`${msg}. :cry:`)
        } else {
          let karma = karmaList[0]['karma']
          return User.findById(karmaList[0]['_id']).then(usar => {
            let msg = `@${user.username}, ${usar.username} is your bitch. They gave you ${karma} karma`
            if (!allTime) msg += ` in the past ${utils.days(hours)}`
            this.sekshi.sendChat(`${msg}.`)
          })
        }
      })
      .catch(err => console.error(err))
  }

  @command('pimp')
  pimp(user, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    Karma.aggregate()
      .match({ giver: user.id, target: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: "$target", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          let msg = `@${user.username} you have been noone's bitch`
          if (!allTime) msg += ` in the past ${utils.days(hours)}`
          this.sekshi.sendChat(`${msg}. :smirk:`)
        } else {
          let karma = karmaList[0]['karma']
          return User.findById(karmaList[0]['_id']).then(usar => {
            let msg = `@${user.username}, ${usar.username} is your pimp. You gave them ${karma} karma`
            if (!allTime) msg += ` in the past ${utils.days(hours)}`
            this.sekshi.sendChat(`${msg}.`)
          })
        }
      })
      .catch(err => console.error(err))
  }

  @command('fistbump')
  fistbump(user) {
    Karma.find({ target: user.id, reason: { $ne: null } }).where('amount').gt(0).populate('giver').exec().then( reasonList => {
      debug(reasonList)
      if (reasonList.length === 0) {
        this.sekshi.sendChat(`@${user.username} no one can explain your mysterious allure.`)
      }
      let chosen = random(reasonList)
      this.sekshi.sendChat(`@${user.username}, you were bumped by @${chosen.giver.username} ` +
                           `"${chosen.reason}" ${moment(chosen.date).fromNow()}`)
    })
  }

  @command('fistthump')
  fistthump(user) {
    Karma.find({ target: user.id, reason: { $ne: null } }).where('amount').lt(0).populate('giver').exec().then( reasonList => {
      if (reasonList.length === 0) {
        this.sekshi.sendChat(`@${user.username} no reason was ever given.`)
      }
      let chosen = random(reasonList)
      this.sekshi.sendChat(`@${user.username}, you were thumped by @${chosen.giver.username} ` +
                           `"${chosen.reason}" ${moment(chosen.date).fromNow()}`)
    })
  }
}
