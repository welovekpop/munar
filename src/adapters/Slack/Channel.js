import assign from 'object-assign'
import SourceMixin from './SourceMixin'
import { linkNames } from './utils'

export default class SlackChannel {
  constructor(slack, channel) {
    assign(this, SourceMixin)
    this.slack = slack
    this.client = slack.client
    this.channel = channel
  }

  reply(message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send(text) {
    this.channel.send(linkNames(this.slack, text))
  }
}
