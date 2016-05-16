import SlackClient from 'slack-client'

import { Adapter } from 'munar-core'

import Channel from './Channel'
import Message from './Message'
import User from './User'

const debug = require('debug')('munar:adapter:slack')

const AUTORECONNECT = true
const AUTOMARK = true

export default class Slack extends Adapter {
  static adapterName = 'slack'

  constructor (bot, options) {
    super(bot)

    this.options = options
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.client = new SlackClient(this.options.token, AUTORECONNECT, AUTOMARK)
      this.client.on('open', () => {
        debug('connected', this.client.team.name)
        resolve()
      })
      this.client.on('loggedIn', (self) => {
        this.self = new User(this, self)
      })
      this.client.on('message', this.onMessage)
      this.client.on('error', reject)

      this.client.login()
    })
  }

  disconnect () {
    this.client.disconnect()
    this.client = null
  }

  getSelf () {
    return this.self
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

  getChannel (id) {
    const channel = this.client.getChannelGroupOrDMByID(id)
    return channel ? new Channel(this, channel) : null
  }

  getChannelByName (name) {
    let channel
    if (name[0] === '@') {
      channel = this.client.getDMByName(name.slice(1))
    } else {
      channel = this.client.getChannelByName(name)
    }
    return channel ? new Channel(this, channel) : null
  }

  onMessage = (slackMessage) => {
    debug([slackMessage.type, slackMessage.subtype].filter(Boolean).join(':'), {
      user: slackMessage.user,
      ...slackMessage.toJSON()
    })
    if (slackMessage.type === 'message') {
      if (slackMessage.subtype && slackMessage.subtype !== 'me_message') {
        return
      }
      const channel = this.getChannel(slackMessage.channel)
      this.receive(
        'message',
        new Message(channel, this.normalizeMessage(slackMessage.text), slackMessage)
      )
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
