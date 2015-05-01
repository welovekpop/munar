const TriviaCore = require('./TriviaCore')
const Promise = require('promise')
const request = require('request')

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
      skipquestion: sekshi.USERROLE.BOUNCER,
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
    return super.defaultOptions()
  }

  // Chat Commands
  trivia(user, test = false) {
    this.sekshi.sendChat(`[Trivia] @everyone ${user.username} started Trivia!`)
    this.startTrivia().then(() => {
      this.sekshi.sendChat(`Loaded ${this.questions.length} questions. First question in 5 seconds!`)
      setTimeout(this.nextQuestion.bind(this), 5 * 1000)
    })
  }

  trivquit(user) {
    if (this._running) {
      this._running = false
      clearTimeout(this._timeout)
      clearTimeout(this._5stimeout)
      clearTimeout(this._nqtimeout)
      if (user) {
        this.sekshi.sendChat(`[Trivia] ${user.username} stopped Trivia.`)
      }
      this.sekshi.removeListener(this.sekshi.CHAT, this.onChat)
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

  skipquestion(user) {
    if (this.isRunning() && this.currentQuestion) {
    }
  }

}
