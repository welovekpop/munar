const TriviaCore = require('./TriviaCore')
const command = require('../command')
const Promise = require('bluebird')
const request = require('request')
const assign = require('object-assign')
const debug = require('debug')('sekshi:trivia')
const moment = require('moment')
const mongoose = require('mongoose')

const TriviaHistory = mongoose.modelNames().indexOf('Trivia') === -1
  ? mongoose.model('Trivia', {
      time: { type: Date, default: Date.now },
      user: { type: Number, ref: 'User' },
      winner: { type: Number, ref: 'User' }
    })
  : mongoose.model('Trivia')

export default class Trivia extends TriviaCore {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'WE ♥ KPOP'
    this.description = ''
  }

  defaultOptions() {
    return assign(super.defaultOptions(), {
      points: 3,
      interval: 5,
      winPosition: 2
    })
  }

  nextQuestion() {
    const target = this.options.points
    const interval = this.options.interval
    super.nextQuestion().then(({ winner, question }) => {
      if (winner) {
        this.addPoints(winner)
        if (this.getPoints(winner) >= target) {
          this.sekshi.sendChat(`[Trivia] @${winner.username} answered correctly and reached ${target} points!` +
                               ` Congratulations! :D`)
          this.sekshi.moveDJ(winner.id, this.options.winPosition - 1)
          this.stopTrivia()
          if (this.model) {
            this.model.set('winner', winner.id).save()
            this.model = null
          }
        }
        else {
          this.sekshi.sendChat(`[Trivia] @${winner.username} answered correctly! Next question in ${interval} seconds!`)
          this._currentQuestion = null
          setTimeout(() => this.nextQuestion(), interval * 1000)
        }
      }
      else {
        this.sekshi.sendChat(`[Trivia] Nobody answered correctly! ` +
                             `The right answer was "${question.answers[0]}". Next question in ${interval} seconds!`)
        this._currentQuestion = null
        setTimeout(() => this.nextQuestion(), interval * 1000)
      }
    }).catch(e => {
      this.sekshi.sendChat(`[Trivia] Something went wrong! Stopping trivia before I explode... :boom:`)
      this.stopTrivia()
      console.error('trivia', e)
    })
  }

  // Chat Commands
  @command('lasttrivia', { role: command.ROLE.BOUNCER })
  lasttrivia(user) {
    if (this.isRunning()) {
      return this.sekshi.sendChat(`@${user.username} Trivia is going on right now!`)
    }

    const notPlayed = () => {
      this.sekshi.sendChat(`@${user.username} I don't remember playing trivia!`)
    }

    TriviaHistory.findOne({})
                 .select('time')
                 .sort({ time: -1 })
                 .exec()
      .then(last => {
        if (last && last.time) {
          const lastPlayed = moment(last.time).utc()
          this.sekshi.sendChat(`@${user.username} The last trivia was started ${lastPlayed.calendar()} (${lastPlayed.fromNow()}).`)
        }
        else {
          notPlayed()
        }
      })
      .catch(notPlayed)
  }

  @command('trivia', { role: command.ROLE.BOUNCER })
  trivia(user) {
    if (!this.isRunning()) {
      this.sekshi.sendChat(`[Trivia] @djs ${user.username} started Trivia! ` +
                           `First to ${this.options.points} points gets waitlist spot #${this.options.winPosition} :)`)
      this.startTrivia().then(() => {
        this.sekshi.sendChat(`Loaded ${this.questions.length} questions. First question in 5 seconds!`)
        setTimeout(() => this.nextQuestion(), 5 * 1000)

        this.model = new TriviaHistory({ user: user.id })
        this.model.save()
          .then(() => { debug('created history item') })
          .catch(e => console.error(e))
      })
    }
  }

  @command('trivquit', 'stoptrivia', { role: command.ROLE.BOUNCER })
  trivquit(user) {
    if (this.isRunning()) {
      this.stopTrivia()
      if (user) {
        this.sekshi.sendChat(`[Trivia] ${user.username} stopped Trivia.`)
      }
    }
  }

  @command('trivpoints')
  trivpoints(user) {
    if (this.isRunning()) {
      let points = Object.keys(this._points)
        .map(uid => ({ uid: uid
                     , user: this.sekshi.getUserByID(uid, true)
                     , points: this._points[uid] }))
        // exclude users who left the room
        // not ideal, but Good Enough™ in 99.99% of cases
        .filter(entry => entry.user)
        .sort((a, b) => a.points > b.points ? -1 : a.points < b.points ? 1 : 0)

      this.sekshi.sendChat(
        'Current top points: ' +
        points.slice(0, 5)
          .map((entry, i) => `#${i + 1} ${entry.user.username} (${entry.points})`)
          .join(', ')
      )
    }
  }

  @command('question')
  question(user) {
    if (this.isRunning()) {
      let question = this.getCurrentQuestion()
      if (question) {
        this.sekshi.sendChat(`[Trivia] @${user.username} The current question is: ${question.question}`)
      }
    }
  }

}
