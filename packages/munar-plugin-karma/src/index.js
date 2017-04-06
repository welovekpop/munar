import { Plugin, command } from 'munar-core'
import random from 'random-item'
import moment from 'moment'
import * as utils from './utils'

import KarmaModel from './Karma'

const debug = require('debug')('munar:karma')

export default class UserKarma extends Plugin {
  static description = 'Keeps track of users\' earned internet points.'

  constructor (bot, options) {
    super(bot, options)

    this.models({
      Karma: KarmaModel
    })
  }

  @command('karma', {
    description: 'Show a user\'s karma.',
    arguments: [
      command.arg.user(),
      command.arg.string()
    ]
  })
  async karma (message, username, time = 'w') {
    const User = this.model('User')
    const Karma = this.model('Karma')

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
      const adapter = message.source.getAdapterName()
      const other = message.source.getUserByName(username)
      let user
      if (other) {
        user = await User.from(other)
      }
      if (!user) {
        user = await this.bot.findUser(username, { adapter: adapter })
      }
      if (!user) {
        message.reply(`I don't know ${username} yet`)
        return
      }
      const karmaList = await Karma.find({
        createdAt: { $gte: since.toDate() },
        target: user._id
      }).select('amount')
      const karma = karmaList.reduce((a, b) => a + b.amount, 0)
      let msg = `${user.username} has ${karma} karma`
      if (!allTime) msg += ` from the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    } else {
      const user = await User.from(message.user)
      if (!user) {
        message.reply('who are you?')
        return
      }
      const karmaList = await Karma.find({
        createdAt: { $gte: since.toDate() },
        target: user._id
      }).select('amount')
      const karma = karmaList.reduce((a, b) => a + b.amount, 0)
      let msg = `you have ${karma} karma`
      if (!allTime) msg += ` from the past ${utils.days(hours)}`
      message.reply(`${msg}.`)
    }
  }

  @command('karmawhores', {
    description: 'Show the top 5 most popular users.',
    arguments: [
      command.arg.string()
    ]
  })
  async karmawhores (message, time = 'w') {
    const User = this.model('User')
    const Karma = this.model('Karma')

    // stole all this shit from !mostplayed in MediaStats
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const karmaList = await Karma.aggregate()
      .match({ createdAt: { $gte: since.toDate() } })
      .group({ _id: '$target', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
      .limit(5)
      .exec()
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

  @command('bump', {
    description: 'Increase someone\'s karma.',
    arguments: [
      command.arg.user()
    ]
  })
  async bump (message, username, ...reason) {
    const User = this.model('User')
    const Karma = this.model('Karma')

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
    const target = await User.from(other)
    const giver = await User.from(user)
    if (target) {
      let bump = new Karma({ target, giver })
      if (reason && reason.length > 0) {
        bump.reason = reason.join(' ')
      }
      await bump.save()

      if (reason && reason.length > 0) {
        message.send(`@${user.username} bumped @${other.username}\'s karma ${reason.join(' ')}`)
      } else {
        message.send(`@${user.username} bumped @${other.username}\'s karma!`)
      }

      return target
    }
  }

  @command('thump', {
    description: 'Decrease someone\'s karma.',
    arguments: [
      command.arg.user()
    ]
  })
  async thump (message, username, ...reason) {
    const User = this.model('User')
    const Karma = this.model('Karma')

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

    const target = await User.from(other)
    const giver = await User.from(user)
    if (target) {
      let thump = new Karma({ target, giver, amount: -1 })
      if (reason && reason.length > 0) {
        thump.reason = reason.join(' ')
      }
      await thump.save()

      if (reason && reason.length > 0) {
        message.send(`@${user.username} thumped @${other.username}\'s karma ${reason.join(' ')}`)
      } else {
        message.send(`@${user.username} thumped @${other.username}\'s karma!`)
      }

      return target
    }
  }

  @command('bitch', {
    description: 'Show the user who has given you the most karma recently.',
    arguments: [
      command.arg.string()
    ]
  })
  async bitch (message, time = 'w') {
    const User = this.model('User')
    const Karma = this.model('Karma')

    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const user = await User.from(message.user)
    const karmaList = await Karma.aggregate()
      .match({ target: user._id, giver: { $ne: 0 }, createdAt: { $gte: since.toDate() } })
      .group({ _id: '$giver', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
      .exec()
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

  @command('pimp', {
    description: 'Show the user who has received the most karma from you recently.',
    arguments: [
      command.arg.string()
    ]
  })
  async pimp (message, time = 'w') {
    const User = this.model('User')
    const Karma = this.model('Karma')

    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'

    const user = await User.from(message.user)
    const karmaList = await Karma.aggregate()
      .match({ giver: user._id, target: { $ne: 0 }, createdAt: { $gte: since.toDate() } })
      .group({ _id: '$target', karma: { $sum: '$amount' } })
      .sort({ karma: -1 })
      .exec()
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

  @command('fistbump', {
    description: 'Show a random bump.'
  })
  async fistbump (message) {
    const User = this.model('User')
    const Karma = this.model('Karma')

    const user = await User.from(message.user)
    const reasonList = await Karma.find({ target: user._id, reason: { $ne: null } })
      .where('amount').gt(0)
      .populate('giver')

    if (reasonList.length > 0) {
      let chosen = random(reasonList)
      message.reply(`you were bumped by @${chosen.giver.username} ` +
                    `"${chosen.reason}" ${moment(chosen.createdAt).fromNow()}`)
    } else {
      message.reply('no one can explain your mysterious allure.')
    }
  }

  @command('fistthump', {
    description: 'Show a random thump.'
  })
  async fistthump (message) {
    const User = this.model('User')
    const Karma = this.model('Karma')

    const user = await User.from(message.user)
    const reasonList = await Karma.find({ target: user._id, reason: { $ne: null } })
      .where('amount').lt(0)
      .populate('giver')
    if (reasonList.length > 0) {
      let chosen = random(reasonList)
      message.reply(`you were thumped by @${chosen.giver.username} ` +
                    `"${chosen.reason}" ${moment(chosen.createdAt).fromNow()}`)
    } else {
      message.reply('no reason was ever given.')
    }
  }
}
