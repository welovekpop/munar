import { command } from '../'
import TriviaCore from './TriviaCore'
import moment from 'moment'
import mongoose from 'mongoose'

const triviaSchema = {
  time: { type: Date, default: Date.now },
  user: { type: Number, ref: 'User' },
  winner: { type: Number, ref: 'User' }
}
const TriviaHistory = mongoose.modelNames().indexOf('Trivia') === -1
  ? mongoose.model('Trivia', triviaSchema)
  : mongoose.model('Trivia')

export default class Trivia extends TriviaCore {
  author = 'WE ♥ KPOP'
  description = ''

  defaultOptions () {
    return {
      ...super.defaultOptions(),
      points: 3,
      interval: 5,
      winPosition: 2
    }
  }

  nextQuestion () {
    const target = this.options.points
    const interval = this.options.interval
    super.nextQuestion().then(({ winner, question }) => {
      if (winner) {
        this.addPoints(winner)
        if (this.getPoints(winner) >= target) {
          this.adapter.send(
            `[Trivia] @${winner.username} answered correctly and reached ${target} points! ` +
            'Congratulations! :D')
          this.stopTrivia()
          if (this.model) {
            this.model.set('winner', winner.id).save()
            this.model = null
          }
        } else {
          this.adapter.send(
            `[Trivia] @${winner.username} answered correctly! ` +
            `Next question in ${interval} seconds!`
          )
          this._currentQuestion = null
          setTimeout(() => this.nextQuestion(), interval * 1000)
        }
      } else {
        this.adapter.send(
          '[Trivia] Nobody answered correctly! ' +
          `The right answer was "${question.answers[0]}". Next question in ${interval} seconds!`
        )
        this._currentQuestion = null
        setTimeout(() => this.nextQuestion(), interval * 1000)
      }
    }).catch((e) => {
      this.adapter.send('[Trivia] Something went wrong! Stopping trivia before I explode... :boom:')
      this.stopTrivia()
      console.error('trivia', e)
    })
  }

  // Chat Commands
  @command('lasttrivia', { role: command.ROLE.BOUNCER })
  lasttrivia (message) {
    if (this.isRunning()) {
      return message.reply('Trivia is going on right now!')
    }

    TriviaHistory.findOne({})
                 .select('time')
                 .sort({ time: -1 })
                 .exec()
      .then((last) => {
        if (last && last.time) {
          const lastPlayed = moment(last.time).utc()
          message.reply(`The last trivia was started ${lastPlayed.calendar()} (${lastPlayed.fromNow()}).`)
        } else {
          message.reply('I don\'t remember playing trivia!')
        }
      })
      .catch(() => {
        message.reply('I don\'t remember playing trivia!')
      })
  }

  @command('trivia', { role: command.ROLE.BOUNCER })
  trivia (message) {
    if (!this.isRunning()) {
      this.adapter = message.source
      message.send(`@here ${message.username} started Trivia! ` +
                   `First to ${this.options.points} points gets waitlist spot #${this.options.winPosition} :)`)
      this.startTrivia().then(() => {
        message.send(`Loaded ${this.questions.length} questions. First question in 5 seconds!`)
        setTimeout(() => this.nextQuestion(), 5 * 1000)
      })
    }
  }

  @command('trivquit', 'stoptrivia', { role: command.ROLE.BOUNCER })
  trivquit (message) {
    if (this.isRunning()) {
      this.stopTrivia()
      if (message.user) {
        this.adapter.send(`[Trivia] ${message.user.username} stopped Trivia.`)
      }
    }
  }

  @command('trivpoints')
  trivpoints (message) {
    if (this.isRunning()) {
      const points = Object.keys(this._points)
        .map((uid) => ({
          uid: uid,
          user: this.sekshi.getUserByID(uid, true),
          points: this._points[uid]
        }))
        // exclude users who left the room
        // not ideal, but Good Enough™ in 99.99% of cases
        .filter((entry) => entry.user)
        .sort((a, b) => a.points > b.points ? -1 : a.points < b.points ? 1 : 0)

      message.reply(
        'Current top points: ' +
        points.slice(0, 5)
          .map((entry, i) => `#${i + 1} ${entry.user.username} (${entry.points})`)
          .join(', ')
      )
    }
  }

  @command('question')
  question (message) {
    if (this.isRunning()) {
      let question = this.getCurrentQuestion()
      if (question) {
        message.reply(`The current question is: ${question.question}`)
      }
    }
  }
}
