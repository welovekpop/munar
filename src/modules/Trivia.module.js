const TriviaCore = require('./TriviaCore')
const Promise = require('promise')
const request = require('request')
const assign = require('object-assign')

export default class Trivia extends TriviaCore {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'WE ♥ KPOP'
    this.version = '0.0.0'
    this.description = ''

    this.permissions = {
      trivia: sekshi.USERROLE.BOUNCER,
      trivquit: sekshi.USERROLE.BOUNCER,
      trivpoints: sekshi.USERROLE.NONE,
      lasttrivia: sekshi.USERROLE.RESIDENTDJ,
      question: sekshi.USERROLE.NONE
    }
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
  trivia(user) {
    if (!this.isRunning()) {
      this.sekshi.sendChat(`[Trivia] @djs ${user.username} started Trivia! ` +
                           `First to ${this.options.points} points gets waitlist spot #${this.options.winPosition} :)`)
      this.startTrivia().then(() => {
        this.sekshi.sendChat(`Loaded ${this.questions.length} questions. First question in 5 seconds!`)
        setTimeout(() => this.nextQuestion(), 5 * 1000)
      })
    }
  }

  trivquit(user) {
    if (this.isRunning()) {
      this.stopTrivia()
      if (user) {
        this.sekshi.sendChat(`[Trivia] ${user.username} stopped Trivia.`)
      }
    }
  }

  trivpoints(user) {
    if (this.isRunning()) {
      let points = Object.keys(this._points).map(uid => {
        return { uid: uid, points: this._points[uid] }
      })
      points.sort((a, b) => a.points > b.points ? -1 : a.points < b.points ? 1 : 0)

      this.sekshi.sendChat('Current top points: ' + points.slice(0, 5).map((x, i) => {
        const u = this.sekshi.getUserByID(x.uid)
        return `#${i + 1} ${u.username} (${x.points})`
      }).join(', '))
    }
  }

  question(user) {
    if (this.isRunning()) {
      let question = this.getCurrentQuestion()
      if (question) {
        this.sekshi.sendChat(`[Trivia] @${user.username} The current question is: ${question.question}`)
      }
    }
  }

}
