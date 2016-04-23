import { Module, command } from '../'
import User from '../models/User'
import Karma from '../models/Karma'
import random from 'random-item'
import moment from 'moment'
import * as utils from '../utils'

const debug = require('debug')('sekshi:karma')

export default class UserKarma extends Module {
  author = 'brookiebeast'
  description = 'Keeps track of users\' earned internet points.'

  @command('karma')
  async karma (message, username, time = 'w') {
    const { user } = message
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
      const usar = await User.findOne({ username })
      if (!usar) {
        message.reply(`I don't know ${username} yet`)
        return undefined
      }
      const karmaList = await Karma.find({
        date: { $gte: since.toDate() },
        target: usar._id
      }).select('amount')
      const karma = karmaList.reduce((a, b) => a + b.amount, 0)
      let msg = `${username} has ${karma} karma`
      if (!allTime) msg += ` from the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    } else {
      const usar = await User.findById(message.user.id)
      if (!usar) {
        message.reply('who are you?')
        return undefined
      }
      const karmaList = await Karma.find({
        date: { $gte: since.toDate() },
        target: usar._id
      }).select('amount')
      const karma = karmaList.reduce((a, b) => a + b.amount, 0)
      let msg = `@${user.username} you have ${karma} karma`
      if (!allTime) msg += ` from the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    }
  }

  @command('karmawhores')
  async karmawhores (message, time = 'w') {
    // stole all this shit from !mostplayed in MediaStats
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const karmaList = await Karma.aggregate()
      .match({ date: { $gte: since.toDate() } })
      .group({ _id: '$target', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
      .limit(5)
    if (karmaList.length === 0) {
      message.reply('none of you like each other T_T')
    } else {
      let karmas = {}
      karmaList.forEach((k) => {
        karmas[k._id] = k.karma
      })
      const users = await User.where('_id').in(Object.keys(karmas)).lean()
      users.forEach((model) => {
        model.karma = karmas[model._id]
      })
      users.sort((a, b) => a.karma > b.karma ? -1 : 1)

      let response = 'Karma leaders'
      if (!allTime) response += ` over the last ${utils.days(hours)}`
      response += ':\n' + users.map((u, rank) => `${rank + 1} - ${u.username}: ${u.karma}`).join('\n')
      message.reply(response)
    }
  }

  @command('bump')
  async bump (message, username, ...reason) {
    const { user } = message

    if (!username) {
      message.reply('You must provide a user to bump')
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = message.source.getUserByName(username)
    if (!other) {
      message.reply('That\'s not a real person…')
      return
    }
    if (other.id === user.id) {
      message.reply('Nice try, smartass!')
      return
    }

    debug('karma bump', `${other.username} (${other.id})`)
    const target = await User.findById(other.id)
    if (target) {
      if (reason && reason.length > 0) {
        message.send(`@${user.username} bumped @${other.username}\'s karma ${reason.join(' ')}`)
      } else {
        message.send(`@${user.username} bumped @${other.username}\'s karma!`)
      }

      let bump = new Karma({ target: target.id, giver: user.id })
      if (reason && reason.length > 0) {
        bump.reason = reason.join(' ')
      }
      await bump.save()

      return target
    }
  }

  @command('thump')
  async thump (message, username, ...reason) {
    const { user } = message

    if (!username) {
      debug('karma thump no username')
      message.reply('You must provide a user to thump')
      return
    }
    if (username.charAt(0) === '@') username = username.slice(1)
    let other = message.source.getUserByName(username)
    if (!other) {
      message.reply('That\'s not a real person…')
      return
    }
    if (other.id === user.id) {
      message.reply('You\'re weird.')
    }

    const target = await User.findById(other.id)
    if (target) {
      if (reason && reason.length > 0) {
        message.send(`@${user.username} thumped @${other.username}\'s karma ${reason.join(' ')}`)
      } else {
        message.send(`@${user.username} thumped @${other.username}\'s karma!`)
      }

      let thump = new Karma({ target: target.id, giver: user.id, amount: -1 })
      if (reason && reason.length > 0) {
        thump.reason = reason.join(' ')
      }
      await thump.save()

      return target
    }
  }

  @command('bitch')
  async bitch (message, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const karmaList = await Karma.aggregate()
      .match({ target: message.user.id, giver: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: '$giver', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
    if (karmaList.length === 0) {
      let msg = 'you have no bitches'
      if (!allTime) msg += ` from the past ${utils.days(hours)}`
      message.reply(`${msg}. :cry:`)
    } else {
      let karma = karmaList[0].karma
      const usar = await User.findById(karmaList[0]._id)
      let msg = `${usar.username} is your bitch. They gave you ${karma} karma`
      if (!allTime) msg += ` in the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    }
  }

  @command('pimp')
  async pimp (message, time = 'w') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const karmaList = await Karma.aggregate()
      .match({ giver: message.user.id, target: { $ne: 0 }, date: { $gte: since.toDate() } })
      .group({ _id: '$target', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
    if (karmaList.length === 0) {
      let msg = 'you have been noone\'s bitch'
      if (!allTime) msg += ` in the past ${utils.days(hours)}`
      message.reply(`${msg}. :smirk:`)
    } else {
      let karma = karmaList[0].karma
      const usar = await User.findById(karmaList[0]._id)
      let msg = `${usar.username} is your pimp. You gave them ${karma} karma`
      if (!allTime) msg += ` in the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    }
  }

  @command('fistbump')
  async fistbump (message) {
    const reasonList = await Karma.find({ target: message.user.id, reason: { $ne: null } })
      .where('amount').gt(0)
      .populate('giver')

    if (reasonList.length === 0) {
      message.reply('no one can explain your mysterious allure.')
    }
    let chosen = random(reasonList)
    message.reply(`you were bumped by @${chosen.giver.username} ` +
                  `${chosen.reason}" ${moment(chosen.date).fromNow()}`)
  }

  @command('fistthump')
  async fistthump (message) {
    const reasonList = await Karma.find({ target: message.user.id, reason: { $ne: null } })
      .where('amount').lt(0)
      .populate('giver')
    if (reasonList.length === 0) {
      message.reply('no reason was ever given.')
    }
    let chosen = random(reasonList)
    message.reply(`you were thumped by @${chosen.giver.username} ` +
                  `"${chosen.reason}" ${moment(chosen.date).fromNow()}`)
  }
}
