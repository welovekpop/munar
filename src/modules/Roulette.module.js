import { Module, command } from '../'
import User from '../models/User'
import HistoryEntry from '../models/HistoryEntry'
import random from 'random-item'
import includes from 'array-includes'
import moment from 'moment'
import mongoose from 'mongoose'

const debug = require('debug')('sekshi:roulette')

const rouletteSchema = {
  time: { type: Date, default: Date.now },
  user: { type: Number, ref: 'User' },
  winner: { type: Number, ref: 'User' },
  duration: Number,
  entrants: [ { type: Number, ref: 'User' } ]
}
const RouletteHistory = mongoose.modelNames().indexOf('Roulette') === -1
  ? mongoose.model('Roulette', rouletteSchema)
  : mongoose.model('Roulette')

export default class Roulette extends Module {
  author = 'ReAnna'
  description = 'Runs random raffles for a set wait list position (probably #1/#2).'
  Roulette = RouletteHistory

  source = this.adapter('uwave').getChannel('main')

  defaultOptions () {
    return {
      duration: 120,
      minPosition: 4,
      timeout: 20 * 60, // seconds
      winnerPosition: 2
    }
  }

  init () {
    this._running = false
    this._players = []
    this._startedBy = null
  }

  destroy () {
    if (this._timer) {
      clearTimeout(this._timer)
    }
  }

  players () {
    let waitlist = this.source.getWaitlist()
    return this._players.filter((user) => includes(waitlist, user.id))
  }

  @command('roulette', { role: command.ROLE.BOUNCER })
  roulette (message) {
    if (this._running) {
      return
    }
    const { user } = message
    this._running = true
    this._players = []
    this._roulette = {
      user: user.id,
      time: Date.now(),
      duration: this.options.duration,
      winner: null,
      entrants: null
    }

    debug('starting roulette')
    this._timer = setTimeout(() => {
      this.onEnd()
    }, this.options.duration * 1000)
    const duration = moment.duration(this.options.duration, 'seconds')
    this.source.send(
      `@djs ${user.username} started Roulette! ` +
      `The winner will be moved to spot ${this.options.winnerPosition} in the wait list. ` +
      `Type "!play" (without quotes) to join. You have ${duration.humanize()}!`
    )
  }

  @command('play', { ninjaVanish: true })
  async play (message) {
    const { user } = message
    if (this._running && this._players.indexOf(user) === -1) {
      const waitlist = this.source.getWaitlist()
      const idx = waitlist.indexOf(user.id)
      if (idx === -1) {
        debug('player not in wait list', user.username)
        message.reply(
          'You need to be in the wait list if you want to join the roulette!',
          10 * 1000
        )
      } else if (idx < this.options.minPosition) {
        debug('player too high' /* lol */, user.username)
        message.reply(
          `You can only join the roulette if you are below position ${this.options.minPosition}!`,
          10 * 1000
        )
      } else {
        const diff = moment.duration(this.options.timeout, 'seconds')
        if (await this._userDJedRecently(user.id)) {
          message.reply(
            'You can only join the roulette if ' +
            `you haven't DJ'd in the past ${diff.humanize()}!`
          )
        } else {
          this._players.push(user)
        }
      }
    }
  }

  @command('withdraw', { ninjaVanish: true })
  withdraw (message) {
    const { user } = message
    let i = this._players.findIndex((player) => player.id === user.id)
    if (this._running && i !== -1) {
      this._players.splice(i, 1)
    }
  }

  @command('players')
  showPlayers (message) {
    if (this._running) {
      debug('players', this._players.length)
      message.send(
        `Roulette players [${this._players.length}]: ` +
        this._players.map((user) => user.username).join(' | ')
      )
    }
  }

  @command('lastroulette', { role: command.ROLE.RESIDENTDJ })
  async lastroulette (message) {
    if (this._running) {
      return message.reply('Roulette is going on right now!')
    }

    try {
      const lastRoulette = await RouletteHistory.findOne({})
        .select('time')
        .sort({ time: -1 })

      if (lastRoulette && lastRoulette.time) {
        const lastPlayed = moment(lastRoulette.time).utc()
        message.reply(`The last roulette was started ${lastPlayed.calendar()} (${lastPlayed.fromNow()}).`)
      } else {
        message.reply('I don\'t remember playing roulette!')
      }
    } catch (err) {
      message.reply('I don\'t remember playing roulette!')
    }
  }

  @command('stoproulette', { role: command.ROLE.BOUNCER })
  stoproulette (message) {
    if (this._running) {
      clearTimeout(this._timer)
      this._timer = null
      this._roulette = null
      this._players = []
      this._running = false
      this.source.send(`@${message.username} stopped roulette!`)
    }
  }

  @command('luckybastards', { role: command.ROLE.RESIDENTDJ })
  async luckybastards (message, amount = 5) {
    const mostWins = await RouletteHistory.aggregate()
      .group({ _id: '$winner', wins: { $sum: 1 } })
      .sort({ wins: -1 })
      .project('_id wins')
      .limit(amount)

    const wins = {}
    mostWins.forEach((w) => {
      wins[w._id] = w.wins
    })

    const userIds = mostWins.map((w) => w._id)
    const users = await User.where('_id').in(userIds).select('_id username')
    users.forEach((user) => {
      user.wins = wins[user._id]
    })
    users.sort((a, b) => a.wins > b.wins ? -1 : 1)

    message.send('Lucky Bastards leaderboard:')
    users.forEach((user, i) => {
      message.send(`#${i + 1} - ${user.username} (${user.wins} wins)`)
    })
  }

  onEnd () {
    this._running = false
    this._timer = null
    let roulette = this._roulette
    let players = this.players()
    roulette.entrants = this._players.map((p) => p.id)
    if (this._players.length === 0) {
      this.source.send('Nobody participated in the roulette... Do I get to win now?')
    } else if (players.length === 0) {
      this.source.send('Nobody is eligible to win the roulette... Too bad!')
    } else {
      let winner = random(players)
      debug('winner', winner.username)
      this.source.send(`Roulette winner: @${winner.username}. Congratulations! https://i.imgur.com/TXKz7mt.gif`)
      this.bot.moveDJ(winner.id, this.options.winnerPosition - 1, () => {
        debug('winner moved')
      })

      roulette.winner = winner.id
    }
    RouletteHistory.create(roulette)
    this._players = []
  }

  async _userDJedRecently (id) {
    try {
      const count = await HistoryEntry
        .where('dj').equals(id)
        .where('time').gt(Date.now() - this.options.timeout * 1000)
        .count()

      // user DJed recently if there is at least one play in
      // the last X minutes
      return count > 0
    } catch (err) {
      // assume user didn't DJ recently on error
      return false
    }
  }
}
