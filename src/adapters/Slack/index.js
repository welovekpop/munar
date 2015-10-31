import assign from 'object-assign'
import autobind from 'autobind-decorator'
import { EventEmitter } from 'events'
import SlackClient from 'slack-client'
import Channel from './Channel'
import Message from './Message'
import SourceMixin from './SourceMixin'

const debug = require('debug')('sekshi:adapter:slack')

const AUTORECONNECT = true
const AUTOMARK = true

export default class Slack extends EventEmitter {
  constructor(sekshi, options) {
    super()
    assign(this, SourceMixin)
    this.sekshi = sekshi
    this.options = options
  }

  enable() {
    this.client = new SlackClient(this.options.token, AUTORECONNECT, AUTOMARK)
    this.client.on('open', () => {
      debug('connected', this.client.team.name)
    })
    this.client.on('message', this.onMessage)
    this.client.on('error', e => {
      throw e
    })

    this.client.login()
  }

  disable() {
    this.client.disconnect()
    this.client = null
  }

  @autobind
  onMessage(slackMessage) {
    if (slackMessage.type === 'message') {
      const channel = new Channel(this, this.getChannel(slackMessage.channel))
      this.emit('message', new Message(this, channel, slackMessage.text, slackMessage))
    } else {
      debug(slackMessage.type, slackMessage)
    }
  }
}
