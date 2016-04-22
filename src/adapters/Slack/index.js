import EventEmitter from 'events'
import SlackClient from 'slack-client'

import { Adapter } from '../../'

import Channel from './Channel'
import Message from './Message'
import User from './User'

import SourceMixin from './SourceMixin'

const debug = require('debug')('sekshi:adapter:slack')

const AUTORECONNECT = true
const AUTOMARK = true

export default class Slack extends Adapter {
  static adapterName = 'slack'

  constructor (bot, options) {
    super(bot)

    Object.assign(this, SourceMixin)

    this.options = options
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.client = new SlackClient(this.options.token, AUTORECONNECT, AUTOMARK)
      this.client.on('open', () => {
        debug('connected', this.client.team.name)
        resolve()
      })
      this.client.on('message', this.onMessage)
      this.client.on('error', e => {
        reject(e)
      })

      this.client.login()
    })
  }

  disconnect () {
    this.client.disconnect()
    this.client = null
  }

  getUsers () {
    const users = this.client.users
    return Object.keys(users).map((id) => {
      return new User(this, this.client.users[id])
    })
  }

  getChannels () {
    const channels = this.client.channels
    return Object.keys(channels).map((id) => {
      return new Channel(this, this.client.channels[id])
    })
  }

  onMessage = (slackMessage) => {
    debug([slackMessage.type, slackMessage.subtype].filter(Boolean).join(':'), {
      user: slackMessage.user,
      ...slackMessage.toJSON()
    })
    if (slackMessage.type === 'message') {
      if (slackMessage.subtype === 'message_changed') {
        return
      }
      const channel = this.getChannel(slackMessage.channel)
      this.emit('message', new Message(this, channel, this.normalizeMessage(slackMessage.text), slackMessage))
    }
  }

  normalizeMessage (text = '') {
    const client = this.client
    return text.trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<!channel>/g, '@channel')
      .replace(/<!group>/g, '@group')
      .replace(/<!everyone>/g, '@everyone')
      .replace(/<#(C\w+)\|?(\w+)?>/g, (_, channelId) => `#${client.getChannelByID(channelId).name}`)
      .replace(/<@(U\w+)\|?(\w+)?>/g, (_, userId) => `@${client.getUserByID(userId).name}`)
      .replace(/<(?!!)(\S+)>/g, (_, link) => link)
      .replace(/<!(\w+)\|?(\w+)?>/g, (_, command, label) => `<${label || command}>`)
  }
}
