const debug = require('debug')('sekshi:roulette')
const assign = require('object-assign')
const SekshiModule = require('../Module')
const moment = require('moment')

export default class Roulette extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '0.4.1'
    this.description = 'Runs random raffles for wait list position #1.'

    super(sekshi, options)

    this.permissions = {
      play: sekshi.USERROLE.NONE,
      players: sekshi.USERROLE.NONE,
      roulette: sekshi.USERROLE.MANAGER
    }
  }

  defaultOptions() {
    return {
      duration: 120
    , minPosition: 6
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
    this._running = true
    this._players = []

    debug('starting roulette')
    this._timer = setTimeout(this.onEnd.bind(this), this.options.duration * 1000)
    const duration = moment.duration(this.options.duration, 'seconds')
    this.sekshi.sendChat(`@djs ${user.username} started Roulette! Type "!play" (without quotes) to join. You have ${duration.humanize()}!`)
  }

  play(user) {
    if (this._running && this._players.indexOf(user) === -1) {

      var waitlist = this.sekshi.getWaitlist()
        , idx = waitlist.indexOf(user.id)
      if (idx === -1) {
        debug('player not in wait list', user.username)
        this.sekshi.sendChat(`@${user.username} You need to be in the wait list if you want to join the raffle!`, 10 * 1000)
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

  players() {
    debug('players', this._players.length)
    this.sekshi.sendChat('Roulette players: ' +
                         this._players.map(user => user.username).join(' | '))
  }

  onEnd() {
    this._running = false
    this._timer = null
    var winner = this._players[Math.floor(Math.random() * this._players.length)]
    debug('winner', winner.username)
    this.sekshi.sendChat(`Roulette winner: @${winner.username}. Congratulations! https://i.imgur.com/TXKz7mt.gif`)
    this.sekshi.moveDJ(winner.id, 0, () => {
      debug('winner moved')
    })
    this._players = []
  }
}
