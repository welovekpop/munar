import SourceMixin from './SourceMixin'
import { linkNames } from './utils'

export default class SlackChannel {
  constructor (slack, channel) {
    Object.assign(this, SourceMixin)
    this.slack = slack
    this.client = slack.client
    this.channel = channel
  }

  getUsers () {
    return this.slack.getUsers()
  }
  getUser (id) {
    return this.slack.getUser(id)
  }
  getUserByName (name) {
    return this.slack.getUserByName(name)
  }

  reply (message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send (text) {
    this.channel.send(linkNames(this.slack, text))
  }

  toString () {
    return `slack:${this.channel.name}`
  }
}
