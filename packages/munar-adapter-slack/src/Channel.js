import { linkNames } from './utils'

const defaultMessageOptions = {
  as_user: true
}

export default class SlackChannel {
  constructor (slack, channel) {
    this.slack = slack
    this.client = slack.client
    this.webClient = slack.webClient
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

  reply (message, text, opts = undefined) {
    this.send(`@${message.username} ${text}`, opts)
  }

  send (text, opts = undefined) {
    if (typeof opts === 'object' && Object.keys(opts).length > 0) {
      const chatClient = this.slack.web.chat
      chatClient.postMessage(
        this.channel.id,
        linkNames(this.slack, text),
        { ...defaultMessageOptions, ...opts }
      )
    } else {
      this.client.sendMessage(linkNames(this.slack, text), this.channel.id)
    }
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
