import assign from 'object-assign'
import SourceMixin from './SourceMixin'

export default class SlackChannel {
  constructor(slack, channel) {
    assign(this, SourceMixin)
    this.slack = slack
    this.client = slack.client
    this.channel = channel
  }

  reply(message, text) {
    this.channel.send(`@${message.username} ${text}`)
  }

  send(text) {
    this.channel.send(text)
  }
}
