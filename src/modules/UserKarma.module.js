import { Module, command } from '../'
import User from '../models/User'
import Karma from '../models/Karma'
import assign from 'object-assign'
import random from 'random-item'
import moment from 'moment'
import * as utils from '../utils'

const debug = require('debug')('sekshi:karma')

export default class UserKarma extends Module {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'brookiebeast'
    this.description = 'Keeps track of users\' earned internet points.'
  }

  @command('karma')
  karma(message, username, time = 'w') {
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
      return User.findOne({ username })
        .then(usar => {
          if (!usar) {
            message.reply(`I don't know ${username} yet`)
            return undefined
          }
          return Karma.find({ date: { $gte: since.toDate() }, target: usar._id })
                      .select('amount')
                      .exec()
            .then(karmaList => {
              let karma = karmaList.reduce( (a, b) => { return a + b.amount }, 0)
              let msg = `${username} has ${karma} karma`
              if (!allTime) msg += ` from the past ${utils.days(hours)}`
              message.reply(`${msg}.`)
            })
        })
    } else {
      return User.findById(message.user.id)
        .then(usar => {
          if (!usar) {
            message.reply(`who are you?`)
            return undefined
          }
          return Karma.find({ date: { $gte: since.toDate() }, target: usar._id })
                      .select('amount')
                      .exec()
            .then(karmaList => {
              let karma = karmaList.reduce( (a, b) => { return a + b.amount }, 0)
              let msg = `@${user.username} you have ${karma} karma`
              if (!allTime) msg += ` from the past ${utils.days(hours)}`
              message.reply(`${msg}.`)
            })
        })
    }
  }

  @command('karmawhores')
  karmawhores(message, time = 'w') {
    // stole all this shit from !mostplayed in MediaStats
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    return Karma.aggregate()
      .match({ date: { $gte: since.toDate() } })
      .group({ _id: "$target", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .limit(5)
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          message.reply(`none of you like each other T_T`)
        }
        else {
          let karmas = {}
          karmaList.forEach(k => { karmas[k._id] = k.karma })
          return User.where('_id').in(karmaList.map(k => k._id)).lean().exec()
            .map(u => assign(u, { karma: karmas[u._id] }))
            .then(users => users.sort((a, b) => a.karma > b.karma ? -1 : 1))
            .then(users => {
              let response = 'Karma leaders'
              if (!allTime) response += ` over the last ${utils.days(hours)}`
              response += ':\n' + users.map((u, rank) => `${rank + 1} - ${u.username}: ${u.karma}`).join('\n')
              message.reply(response)
            })
        }
      })
  }

  @command('bump')
  bump(message, username, ...reason) {
    if (!username) {
      message.reply(`You must provide a user to bump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = message.source.getUserByName(username)
    if (!other) {
      message.reply(`That's not a real person…`)
      return
    }
    if (other.id === user.id) {
      message.reply(`Nice try, smartass!`)
      return
    }

    debug('karma bump', `${other.username} (${other.id})`)
    User.findById(other.id).exec().then(target => {
      if (target) {
        if (reason && reason.length > 0) {
          message.send(`@${user.username} bumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          message.send(`@${user.username} bumped @${other.username}\'s karma!`)
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
  thump(message, username, ...reason) {
    if (!username) {
      debug('karma thump no username')
      message.reply(`You must provide a user to thump`)
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = this.sekshi.getUserByName(username, true)
    if (!other) {
      message.reply(`That's not a real person…`)
      return
    }
    if (other.id === user.id) {
      message.reply(`You\'re weird.`)
    }

    User.findById(other.id).exec().then(target => {
      if (target) {
        if (reason && reason.length > 0) {
          message.send(`@${user.username} thumped @${other.username}\'s karma ${reason.join(' ')}`)
        } else {
          message.send(`@${user.username} thumped @${other.username}\'s karma!`)
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
  bitch(message, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    return Karma.aggregate()
      .match({ target: message.user.id, giver: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: "$giver", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          let msg = `you have no bitches`
          if (!allTime) msg += ` from the past ${utils.days(hours)}`
          message.reply(`${msg}. :cry:`)
        } else {
          let karma = karmaList[0]['karma']
          return User.findById(karmaList[0]['_id']).then(usar => {
            let msg = `${usar.username} is your bitch. They gave you ${karma} karma`
            if (!allTime) msg += ` in the past ${utils.days(hours)}`
            message.reply(`${msg}.`)
          })
        }
      })
  }

  @command('pimp')
  pimp(user, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    return Karma.aggregate()
      .match({ giver: message.user.id, target: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: "$target", karma: { $sum: "$amount" } })
      .sort({ karma: -1 })
      .exec()
      .then(karmaList => {
        if (karmaList.length === 0) {
          let msg = `you have been noone's bitch`
          if (!allTime) msg += ` in the past ${utils.days(hours)}`
          message.reply(`${msg}. :smirk:`)
        } else {
          let karma = karmaList[0]['karma']
          return User.findById(karmaList[0]['_id']).then(usar => {
            let msg = `${usar.username} is your pimp. You gave them ${karma} karma`
            if (!allTime) msg += ` in the past ${utils.days(hours)}`
            message.reply(`${msg}.`)
          })
        }
      })
  }

  @command('fistbump')
  fistbump(message) {
    return Karma.find({ target: message.user.id, reason: { $ne: null } })
      .where('amount').gt(0)
      .populate('giver')
      .exec()
      .then(reasonList => {
        debug(reasonList)
        if (reasonList.length === 0) {
          message.reply(`no one can explain your mysterious allure.`)
        }
        let chosen = random(reasonList)
        message.reply(`you were bumped by @${chosen.giver.username} ` +
                      `${chosen.reason}" ${moment(chosen.date).fromNow()}`)
      })
  }

  @command('fistthump')
  fistthump(user) {
    return Karma.find({ target: user.id, reason: { $ne: null } })
      .where('amount').lt(0)
      .populate('giver')
      .exec()
      .then(reasonList => {
        if (reasonList.length === 0) {
          message.reply(`no reason was ever given.`)
        }
        let chosen = random(reasonList)
        message.reply(`you were thumped by @${chosen.giver.username} ` +
                      `"${chosen.reason}" ${moment(chosen.date).fromNow()}`)
      })
  }
}
