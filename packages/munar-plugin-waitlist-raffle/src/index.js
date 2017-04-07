import { Plugin, command, permissions } from 'munar-core'
import moment from 'moment'
import random from 'random-item'

const debug = require('debug')('munar:raffle')

function assertSupportsRaffles (source) {
  if (typeof source.getWaitlist !== 'function') {
    throw new Error('This adapter does not have a waitlist.')
  }
  const wl = source.getWaitlist()
  const required = ['all', 'positionOf', 'move']
  for (const fn of required) {
    if (typeof wl[fn] !== 'function') {
      throw new Error(`This adapter's waitlist does not support required function "${fn}()".`)
    }
  }
}

export default class WaitlistRaffle extends Plugin {
  static description = 'Run raffles for a waitlist position.'

  static defaultOptions = {
    duration: 60,
    minPosition: 4,
    winnerPosition: 2,
    winMessage: 'Raffle winner: @$winner. Congratulations!'
  }

  timer = null
  running = false
  players = []
  source = null

  constructor (bot, options) {
    super(bot, options)

    this.onEnd = this.onEnd.bind(this)
  }

  @command('raffle', {
    role: permissions.MODERATOR,
    description: 'Start a raffle. Users can type `!play` for a chance to be moved up in the waitlist.'
  })
  startRaffle (message) {
    if (this.running) {
      return
    }
    assertSupportsRaffles(message.source)

    this.running = true
    this.source = message.source
    this.players = []

    debug('starting raffle')
    this.timer = setTimeout(this.onEnd, this.options.duration * 1000)
    const duration = moment.duration(this.options.duration, 'seconds')

    message.send(
      `@djs ${message.username} started a raffle! ` +
      `The winner will be moved to spot ${this.options.winnerPosition} in the waitlist. ` +
      `Type "!play" (without quotes) to join. You have ${duration.humanize()}!`
    )
  }

  @command('play', {
    description: 'Enter a raffle.'
  })
  async enterRaffle (message) {
    const { user } = message

    if (!this.running) {
      return
    }

    message.delete()

    const waitlist = this.source.getWaitlist()
    const position = await waitlist.positionOf(user)
    if (position === -1) {
      message.reply('You need to be in the waitlist if you want to join the raffle!')
      return
    }

    if (!this.players.some((player) => player.id === user.id)) {
      debug('enter', user.username)
      this.players.push(user)
    }
  }

  @command('withdraw', {
    description: 'Withdraw from participation in a raffle.'
  })
  withdraw (message) {
    const { user } = message
    let i = this.players.findIndex((player) => player.id === user.id)
    if (this.running && i !== -1) {
      this.players.splice(i, 1)
    }
    message.delete()
  }

  @command('players', {
    description: 'List the users participating in the current raffle.'
  })
  showPlayers (message) {
    if (!this.running) {
      return
    }
    debug('players', this.players.length)
    message.send(
      `Raffle players [${this.players.length}]: ` +
      this.players.map((user) => user.username).join(' | ')
    )
  }

  async getPlayers () {
    const waitlist = await this.source.getWaitlist().all()
    const players = []

    for (const player of this.players) {
      if (waitlist.some((user) => user.id === player.id)) {
        players.push(player)
      }
    }

    return players
  }

  async onEnd () {
    this.running = false
    clearTimeout(this.timer)
    this.timer = null
    const players = await this.getPlayers()
    if (this.players.length === 0) {
      this.source.send('Nobody participated in the raffle... Do I get to win now?')
    } else if (players.length === 0) {
      this.source.send('Nobody is eligible to win the raffle... Too bad!')
    } else {
      const winner = random(this.players)
      debug('winner', winner.toString())
      this.source.send(
        this.options.winMessage.replace(/\$winner/g, winner.username)
      )
      const waitlist = this.source.getWaitlist()
      await waitlist.move(winner, this.options.winnerPosition - 1)
    }
    this.players = []
    this.source = null
  }
}
