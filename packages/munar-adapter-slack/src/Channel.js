import { linkNames } from './utils'

export default class SlackChannel {
  constructor (slack, channel) {
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

  getChannels () {
    return this.slack.getChannels()
  }
  getChannel (id) {
    return this.slack.getChannel(id)
  }
  getChannelByName (name) {
    return this.slack.getChannelByName(name)
  }

  reply (message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send (text) {
    this.client.sendMessage(linkNames(this.slack, text), this.channel.id)
  }

  canExecute (message) {
    return true
  }

  getAdapterName () {
    return this.slack.getAdapterName()
  }

  toString () {
    return `slack:${this.channel.name}`
  }
}
