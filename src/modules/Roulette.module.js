const debug = require('debug')('sekshi:roulette')
const assign = require('object-assign')
const SekshiModule = require('../Module')
const moment = require('moment')

export default class Roulette extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '1.0.0'
    this.description = 'Runs random raffles for wait list position #1.'

    super(sekshi, options)

    this.permissions = {
      play: sekshi.USERROLE.NONE,
      withdraw: sekshi.USERROLE.NONE,
      players: sekshi.USERROLE.NONE,
      lastroulette: sekshi.USERROLE.BOUNCER,
      roulette: sekshi.USERROLE.BOUNCER
    }

    this.ninjaVanish = [ 'play' ]
  }

  defaultOptions() {
    return {
      duration: 120
    , minPosition: 6
    , winnerPosition: 2
      // hack for persistent-ish storage of last played time
    , _lastPlayed: false
    }
  }

  init() {
    this._running = false
    this._players = []
  }

  destroy() {
    if (this._timer) {
      clearTimeout(this._timer)
    }
  }

  roulette(user) {
    if (this._running) {
      return
    }
    this._running = true
    this._players = []

    debug('starting roulette')
    this._timer = setTimeout(this.onEnd.bind(this), this.options.duration * 1000)
    const duration = moment.duration(this.options.duration, 'seconds')
    this.sekshi.sendChat(`@djs ${user.username} started Roulette! ` +
                         `The winner will be moved to spot ${this.options.winnerPosition} in the wait list.` +
                         ` Type "!play" (without quotes) to join. You have ${duration.humanize()}!`)

    this.options._lastPlayed = Date.now()
  }

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
        debug('new player', user.username)
        this._players.push(user)
      }
    }
  }

  withdraw(user) {
    let i = this._players.indexOf(user)
    if (this._running && i !== -1) {
      this._players.splice(i, 1)
    }
  }

  players() {
    debug('players', this._players.length)
    this.sekshi.sendChat('Roulette players: ' +
                         this._players.map(user => user.username).join(' | '))
  }

  lastroulette(user) {
    const lastPlayed = this.options._lastPlayed ? moment(this.options._lastPlayed) : null
    if (lastPlayed) {
      this.sekshi.sendChat(`@${user.username} The last roulette was started ${lastPlayed.calendar()} (${lastPlayed.fromNow()}).`)
    }
    else {
      this.sekshi.sendChat(`@${user.username} I don't remember playing roulette!`)
    }
  }

  onEnd() {
    this._running = false
    this._timer = null
    if (this._players.length === 0) {
      this.sekshi.sendChat(`Nobody participated in the roulette... Do I get to win now?`)
    }
    else {
      let winner = this._players[Math.floor(Math.random() * this._players.length)]
      debug('winner', winner.username)
      this.sekshi.sendChat(`Roulette winner: @${winner.username}. Congratulations! https://i.imgur.com/TXKz7mt.gif`)
      this.sekshi.moveDJ(winner.id, this.options.winnerPosition - 1, () => {
        debug('winner moved')
      })
    }
    this._players = []
  }
}
