const SekshiModule = require('../Module')
const Promise = require('promise')
const request = require('request')

function normalizeAnswer(a) {
  return a.toLowerCase().replace(/\s+/g, ' ')
}

export default class TriviaCore extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.onChat = this.onChat.bind(this)
  }

  init() {
    this.questions = []
    this._currentQuestion = null
  }
  destroy() {
    if (this._running) {
      this.trivquit()
    }
    this.questions = []
  }

  defaultOptions() {
    return {
      data: 'https://spreadsheets.google.com/feeds/list/1agQloBvRb1zS3Kf9NPZVD9iI5hE-sdNw62adcna4HPE/od6/public/full?alt=json',
      roundDuration: 120,
      historySize: 100
    }
  }

  isRunning() {
    return this._running
  }

  startTrivia() {
    this._running = true
    this._history = []
    this._points = {}
    this.sekshi.on(this.sekshi.CHAT, this.onChat)

    return this._load()
      .catch(e => console.error(e))
  }

  // public api
  nextQuestion() {
    if (this.isRunning()) {
      let question
      do {
        question = this.questions[Math.floor(Math.random() * this.questions.length)]
      } while (this._history.indexOf(question) !== -1)

      return this.askQuestion(question)
    }
    return Promise.reject(new Error('Trivia is not running'))
  }

  askQuestion(question) {
    this.sekshi.sendChat(`[Trivia] From the "${question.category}" category: ${question.question}`)

    this._currentQuestion = question
    this._history.push(question)
    if (this._history.length > this.options.historySize) {
      this._history.shift()
    }

    this._timeout = setTimeout(this.notAnswered.bind(this), this.options.roundDuration * 1000)
  }

  showWinner(winner, answer) {
    this.sekshi.sendChat(`[Trivia] "${answer}" is correct! ${winner.username} wins the round. ` +
                         `Next question in 15 seconds!`)
    this.addPoints(winner)

    clearTimeout(this._timeout)
    this._currentQuestion = null

    this._5stimeout = setTimeout(() => { this.sekshi.sendChat(`[Trivia] 5 seconds...`) }, 10 * 1000)
    this._nqtimeout = setTimeout(this.nextQuestion.bind(this), 15 * 1000)
  }

  notAnswered() {
    this.sekshi.sendChat(`[Trivia] Nobody answered correctly. It was "${this._currentQuestion.answers[0]}", so I win this round~ ^o^/`)
    this.addPoints(this.sekshi.getSelf())
    this._currentQuestion = null

    this._nqtimeout = setTimeout(this.nextQuestion.bind(this), 5 * 1000)
  }

  addPoints(user, points = 1) {
    this._points[user.id] = (this._points[user.id] || 0) + points
  }

  onChat(msg) {
    if (this._running && this._currentQuestion) {
      const answer = normalizeAnswer(msg.message)
      if (this._currentQuestion.answers.indexOf(answer) !== -1) {
        const user = this.sekshi.getUserByID(msg.id)
        this.showWinner(user, msg.message)
      }
    }
  }

  addQuestion(question) {
    this.questions.push(question)
  }

  _load() {
    return new Promise((resolve, reject) => {
      request({ uri: this.options.data, json: true }, (e, _, body) => {
        if (e) reject(e)
        else {
          this._loadFromGoogleSheets(body)
          resolve(this.questions)
        }
      })
    })
  }
  _loadFromGoogleSheets(json) {
    const $t = obj => obj && obj.$t && obj.$t.trim()

    json.feed.entry.forEach(entry => {
      this.addQuestion(new Question(
        $t(entry.gsx$category),
        $t(entry.gsx$question),
        $t(entry.gsx$answer),
        $t(entry.gsx$altanswer1),
        $t(entry.gsx$altanswer2),
        $t(entry.gsx$altanswer3)
      ))
    })
  }

  _historySize() {
    return this.options.historySize === 'auto'
      ? 0.75 * this.questions.length
      : this.options.historySize
  }

}

class Question {
  constructor(category, question, ...answers) {
    this.category = category
    this.question = question
    this.answers = answers.filter(a => a).map(normalizeAnswer)
  }
}