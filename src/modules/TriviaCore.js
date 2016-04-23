import { Module } from '../'
import Promise from 'bluebird'
import random from 'random-item'
import request from 'request'
import includes from 'array-includes'
import parseCsv from 'csv-parse'

const debug = require('debug')('sekshi:trivia')

function normalizeAnswer (a) {
  return a.toLowerCase()
    .replace(/\s+/g, ' ')      // spaces
    .replace(/!\.,-\?:'/g, '') // punctuation
    .trim()
}

export default class TriviaCore extends Module {
  destroy () {
    if (this.isRunning()) {
      this.stopTrivia()
    }
    this.questions = []
  }

  defaultOptions () {
    return {
      data: 'https://docs.google.com/spreadsheets/d/1agQloBvRb1zS3Kf9NPZVD9iI5hE-sdNw62adcna4HPE/pub?gid=0&single=true&output=csv',
      type: 'csv',
      roundDuration: 120,
      historySize: 100
    }
  }

  isRunning () {
    return this._running
  }

  startTrivia () {
    debug('starting')
    this._running = true
    this._history = []
    this._points = {}
    this.questions = []
    this._currentQuestion = null
    this.bot.on('message', this.onChat)

    return this._load()
  }

  // public api
  nextQuestion () {
    if (this.isRunning()) {
      let question
      do {
        question = random(this.questions)
      } while (this._history.indexOf(question) !== -1)

      return this.askQuestion(question)
    }
    return Promise.reject(new Error('Trivia is not running'))
  }

  askQuestion (question) {
    return new Promise((resolve, reject) => {
      this.adapter.send(`[Trivia] From the "${question.category}" category: ${question.question}`)

      this._currentQuestion = question
      this._history.push(question)
      if (this._history.length > this.options.historySize) {
        this._history.shift()
      }

      this._resolve = resolve
      this._reject = reject
      this._timeout = setTimeout(() => this.notAnswered(),
                                 this.options.roundDuration * 1000)
    })
  }

  showWinner (winner, answer) {
    this.adapter.send(`[Trivia] "${answer}" is correct! ${winner.username} wins the round.`)

    clearTimeout(this._timeout)

    this._resolve({ winner, question: this._currentQuestion })

    this._currentQuestion = null
  }

  notAnswered () {
    this._resolve({ winner: null, question: this._currentQuestion })
    this._currentQuestion = null
  }

  addPoints (user, points = 1) {
    this._points[user.id] = (this._points[user.id] || 0) + points
  }
  getPoints (user) {
    return this._points[user.id] || 0
  }

  getCurrentQuestion () {
    return this._currentQuestion
  }

  stopTrivia () {
    this._running = false
    clearTimeout(this._timeout)
    this.bot.removeListener('message', this.onChat)
  }

  onChat = (message) => {
    if (this._running && this._currentQuestion) {
      const answer = normalizeAnswer(message.text)
      if (this._currentQuestion.check(answer)) {
        this.showWinner(message.user, message.text)
      }
    }
  }

  addQuestion (question) {
    this.questions.push(question)
  }

  _load () {
    return new Promise((resolve, reject) => {
      request({ uri: this.options.data }, (e, _, body) => {
        if (e) {
          reject(e)
        } else {
          resolve(body)
        }
      })
    })
    .then((body) => this.parse(body, this.options.type))
    .then((questions) => {
      this.questions = questions
    })
  }
  parse (data, type) {
    if (type === 'csv') {
      return new Promise((resolve, reject) => {
        parseCsv(data.slice(data.indexOf('\n')), (e, questions) => {
          if (e) {
            reject(e)
          } else {
            resolve(
              questions.map((arr) => new Question(arr[0], arr[1], arr.slice(3), arr[2]))
            )
          }
        })
      })
    } else {
      return Promise.reject(new Error('Unknown data type'))
    }
  }

  _historySize () {
    return this.options.historySize === 'auto'
      ? 0.75 * this.questions.length
      : this.options.historySize
  }
}

class Question {
  constructor (category, question, answers, points = 1) {
    this.category = category
    this.question = question
    this.answers = answers.map(normalizeAnswer).filter((answer) => answer.length > 0)
  }

  check (answer) {
    return includes(this.answers, answer)
  }
}
