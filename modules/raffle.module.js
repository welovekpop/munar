var debug = require('debug')('sekshi:raffle')
var assign = require('object-assign')

module.exports = Raffle

export default class Raffle {

  constructor(sekshi, conf = {}) {
    this.name = 'Raffle'
    this.author = 'ReAnna'
    this.version = '0.1.0'
    this.description = 'Runs random raffles for wait list position #1.'

    this.sekshi = sekshi

    this.permissions = {
      play: sekshi.USERROLE.NONE,
      players: sekshi.USERROLE.NONE,
      lottery: sekshi.USERROLE.MANAGER
    }

    this.options = assign({
      duration: 120
    , minPosition: 6
    }, conf)

    this._running = false
    this._players = []
  }

  lottery(user) {
    this._running = true
    this._players = []

    debug('starting raffle')
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
        this.sekshi.sendChat(`@${user.username} You can only join the raffle if you are on position ${this.option.minPosition} or higher!`)
      }
      else {
        this._players.push(user)
      }
    }
  }

  players() {
    debug('players', this._players.length)
    this.sekshi.sendChat('Raffle players: ' +
                         this._players.map(user => user.username).join(' | '))
  }

  onEnd() {
    this._running = false
    var winner = this._players[Math.floor(Math.random() * this._players.length)]
    debug('winner', winner.username)
    this.sekshi.sendChat(`Raffle winner: @${winner.username}`)
    this.sekshi.moveDJ(winner.id, 1, () => {
      debug('winner moved')
    })
    this._players = []
  }
}