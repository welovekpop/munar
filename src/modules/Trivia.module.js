const TriviaCore = require('./TriviaCore')
const Promise = require('promise')
const request = require('request')
const assign = require('object-assign')

function normalizeAnswer(a) {
  return a.toLowerCase().replace(/\s+/g, ' ')
}

export default class Trivia extends TriviaCore {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'WE ♥ KPOP'
    this.version = '0.0.0'
    this.description = ''

    this.permissions = {
      trivia: sekshi.USERROLE.MANAGER,
      trivquit: sekshi.USERROLE.MANAGER,
      trivpoints: sekshi.USERROLE.BOUNCER
    }
  }

  init() {
    super.init()
  }
  destroy() {
    super.destroy()
  }

  defaultOptions() {
    return assign(super.defaultOptions(), {
      points: 3
    })
  }

  nextQuestion() {
    const target = this.options.points
    super.nextQuestion().then(({ winner, question }) => {
      if (winner) {
        this.addPoints(winner)
        if (this.getPoints(winner) >= target) {
          this.sekshi.sendChat(`[Trivia] @${winner.username} answered correctly and reached ${target} points!` +
                               ` Congratulations! :D`)
          this.sekshi.moveDJ(winner.id, 1)
          this.stopTrivia()
        }
        else {
          this.sekshi.sendChat(`[Trivia] @${winner.username} answered correctly! Next question in 5 seconds!`)
          setTimeout(() => this.nextQuestion(), 5 * 1000)
        }
      }
      else {
        this.sekshi.sendChat(`[Trivia] Nobody answered correctly! ` +
                             `The right answer was "${question.answers[0]}". Next question in 5 seconds!`)
        setTimeout(() => this.nextQuestion(), 5 * 1000)
      }
    }).catch(e => {
      this.sekshi.sendChat(`[Trivia] Something went wrong! Stopping trivia before I explode... :boom:`)
      this.stopTrivia()
      console.error('trivia', e)
    })
  }

  // Chat Commands
  trivia(user, test = false) {
    this.sekshi.sendChat(`[Trivia] @everyone ${user.username} started Trivia!`)
    this.startTrivia().then(() => {
      this.sekshi.sendChat(`Loaded ${this.questions.length} questions. First question in 5 seconds!`)
      setTimeout(() => this.nextQuestion(), 5 * 1000)
    })
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

}
