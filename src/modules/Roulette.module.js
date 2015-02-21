const debug = require('debug')('sekshi:roulette')
const assign = require('object-assign')
const SekshiModule = require('../Module')

export default class Roulette extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'Roulette'
    this.author = 'ReAnna'
    this.version = '0.2.0'
    this.description = 'Runs random raffles for wait list position #1.'

    super(sekshi, options)

    this.permissions = {
      play: sekshi.USERROLE.NONE,
      players: sekshi.USERROLE.NONE,
      roulette: sekshi.USERROLE.MANAGER
    }

    this._running = false
    this._players = []
  }

  defaultOptions() {
    return {
      duration: 120
    , minPosition: 6
    }
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
  }

  play(user) {
    if (this._running && this._players.indexOf(user) === -1) {
      debug('new player', user.username)

      var waitlist = this.sekshi.getWaitlist()
        , idx = waitlist.indexOf(user)
      if (idx === -1) {
        this.sekshi.sendChat(`@${user.username} You need to be in the wait list if you want to join the raffle!`)
      }
      else if (idx < this.options.minPosition) {
        this.sekshi.sendChat(`@${user.username} You can only join the roulette if you are on position ${this.option.minPosition} or higher!`)
      }
      else {
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
    this.sekshi.sendChat(`Roulette winner: @${winner.username}. Congratulations!`)
    this.sekshi.moveDJ(winner.id, 0, () => {
      debug('winner moved')
    })
    this._players = []
  }
}