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
    this.send(`@${message.username} ${text}`)
  }

  send(text) {
    this.channel.postMessage({ text, as_user: true, link_names: true })
  }
}
