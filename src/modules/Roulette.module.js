const debug = require('debug')('sekshi:roulette')
const assign = require('object-assign')
const random = require('random-item')
const includes = require('array-includes')
const SekshiModule = require('../Module')
const command = require('../command')
const moment = require('moment')
const mongoose = require('mongoose')
const { User, HistoryEntry } = require('../models')

const RouletteHistory = mongoose.modelNames().indexOf('Roulette') === -1
  ? mongoose.model('Roulette', {
      time: { type: Date, default: Date.now },
      user: { type: Number, ref: 'User' },
      winner: { type: Number, ref: 'User' },
      duration: Number,
      entrants: [ { type: Number, ref: 'User' } ]
    })
  : mongoose.model('Roulette')

export default class Roulette extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Runs random raffles for a set wait list position (probably #1/#2).'

    this.Roulette = RouletteHistory
  }

  defaultOptions() {
    return {
      duration: 120
    , minPosition: 4
    , timeout: 20 * 60 // seconds
    , winnerPosition: 2
    }
  }

  init() {
    this._running = false
    this._players = []
    this._startedBy = null
  }

  destroy() {
    if (this._timer) {
      clearTimeout(this._timer)
    }
  }

  players() {
    let waitlist = this.sekshi.getWaitlist()
    return this._players.filter(user => includes(waitlist, user.id))
  }

  @command('roulette', { role: command.ROLE.BOUNCER })
  roulette(user) {
    if (this._running) {
      return
    }
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
    this._timer = setTimeout(this.onEnd.bind(this), this.options.duration * 1000)
    const duration = moment.duration(this.options.duration, 'seconds')
    this.sekshi.sendChat(`@djs ${user.username} started Roulette! ` +
                         `The winner will be moved to spot ${this.options.winnerPosition} in the wait list. ` +
                         `Type "!play" (without quotes) to join. You have ${duration.humanize()}!`)
  }

  @command('play', { ninjaVanish: true })
  play(user) {
    if (this._running && this._players.indexOf(user) === -1) {
      var waitlist = this.sekshi.getWaitlist()
        , idx = waitlist.indexOf(user.id)
      if (idx === -1) {
        debug('player not in wait list', user.username)
        this.sekshi.sendChat(`@${user.username} You need to be in the wait list if you want to join the roulette!`, 10 * 1000)
      }
      else if (idx < this.options.minPosition) {
        debug('player too high' /* lol */, user.username)
        this.sekshi.sendChat(`@${user.username} You can only join the roulette if you are below position ${this.options.minPosition}!`, 10 * 1000)
      }
      else {
        let diff = moment.duration(this.options.timeout, 'seconds')
        this._userDJedRecently(user.id).then(did => {
          if (did) {
            this.sekshi.sendChat(
              `@${user.username} You can only join the roulette if ` +
              `you haven't DJ'd in the past ${diff.humanize()}!`
            )
          }
          else {
            this._players.push(user)
          }
        })
      }
    }
  }

  @command('withdraw', { ninjaVanish: true })
  withdraw(user) {
    let i = this._players.indexOf(user)
    if (this._running && i !== -1) {
      this._players.splice(i, 1)
    }
  }

  @command('players')
  showPlayers() {
    if (this._running) {
      debug('players', this._players.length)
      this.sekshi.sendChat(`Roulette players [${this._players.length}]: ` +
                           this._players.map(user => user.username).join(' | '))
    }
  }

  @command('lastroulette', { role: command.ROLE.RESIDENTDJ })
  lastroulette(user) {
    const notPlayed = () => {
      this.sekshi.sendChat(`@${user.username} I don't remember playing roulette!`)
    }

    RouletteHistory.findOne({}).select('time').sort({ time: -1 }).exec()
      .then(lastRoulette => {
        if (lastRoulette && lastRoulette.time) {
          const lastPlayed = moment(lastRoulette.time).utc()
          this.sekshi.sendChat(`@${user.username} The last roulette was started ${lastPlayed.calendar()} (${lastPlayed.fromNow()}).`)
        }
        else {
          notPlayed()
        }
      })
      .catch(notPlayed)
  }

  @command('stoproulette', { role: command.ROLE.BOUNCER })
  stoproulette(user) {
    if (this._running) {
      clearTimeout(this._timer)
      this._timer = null
      this._roulette = null
      this._players = []
      this._running = false
      this.sekshi.sendChat(`@${user.username} stopped roulette!`)
    }
  }

  @command('luckybastards', { role: command.ROLE.RESIDENTDJ })
  luckybastards(user, amount = 5) {
    RouletteHistory.aggregate()
      .group({ _id: '$winner', wins: { $sum: 1 } })
      .sort({ wins: -1 })
      .project('_id wins')
      .limit(amount)
      .exec()
      .then(mostWins => {
        const wins = {}
        mostWins.forEach(w => wins[w._id] = w.wins)
        return User.where('_id').in(mostWins.map(w => w._id)).select('_id username').exec()
          .map(u => assign(u, { wins: wins[u._id] }))
          .then(users => {
            this.sekshi.sendChat(`Lucky Bastards leaderboard:`)
            return users.sort((a, b) => a.wins > b.wins ? -1 : 1)
          })
          .each((u, i) => { this.sekshi.sendChat(`#${i + 1} - ${u.username} (${u.wins} wins)`) })
      })
      .catch(e => console.error(e))
  }

  onEnd() {
    this._running = false
    this._timer = null
    let roulette = this._roulette
    let players = this.players()
    roulette.entrants = this._players.map(p => p.id)
    if (this._players.length === 0) {
      this.sekshi.sendChat(`Nobody participated in the roulette... Do I get to win now?`)
    }
    else if (players.length === 0) {
      this.sekshi.sendChat(`Nobody is eligible to win the roulette... Too bad!`)
    }
    else {
      let winner = random(players)
      debug('winner', winner.username)
      this.sekshi.sendChat(`Roulette winner: @${winner.username}. Congratulations! https://i.imgur.com/TXKz7mt.gif`)
      this.sekshi.moveDJ(winner.id, this.options.winnerPosition - 1, () => {
        debug('winner moved')
      })

      roulette.winner = winner.id
    }
    RouletteHistory.create(roulette)
    this._players = []
  }

  _userDJedRecently(id) {
    return HistoryEntry
      .where('dj').equals(id)
      .where('time').gt(Date.now() - this.options.timeout * 1000)
      .count().exec()
      // user DJed recently if there is at least one play in
      // the last X minutes
      .then(count => count > 0)
      // assume user didn't DJ recently on error
      .catch(e => false)
  }

}
