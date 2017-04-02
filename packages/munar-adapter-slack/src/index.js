import {
  RtmClient,
  WebClient,
  MemoryDataStore,
  CLIENT_EVENTS as EVENTS
} from '@slack/client'

import { Adapter } from 'munar-core'

import Channel from './Channel'
import Message from './Message'
import User from './User'

const debug = require('debug')('munar:adapter:slack')

export default class Slack extends Adapter {
  static adapterName = 'slack'

  store = new MemoryDataStore()

  constructor (bot, options) {
    super(bot)

    this.options = options
  }

  async connect () {
    return new Promise((resolve, reject) => {
      this.web = new WebClient(this.options.token)

      this.client = new RtmClient(this.options.token, {
        dataStore: this.store,
        autoReconnect: true,
        autoMark: true
      })
      this.client.on(EVENTS.RTM.RTM_CONNECTION_OPENED, (self) => {
        const team = this.store.getTeamById(this.client.activeTeamId)
        const user = this.store.getUserById(this.client.activeUserId)
        debug('connected', team.name, user.name)
        this.self = new User(this, user)

        resolve()
      })
      this.client.on('message', this.onMessage)
      this.client.on('error', reject)

      this.webClient = new WebClient(this.options.token)

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
    const users = this.store.users
    return Object.keys(users).map((id) => {
      return new User(this, this.store.getUserById(id))
    })
  }

  getChannels () {
    const channels = this.store.channels
    return Object.keys(channels).map((id) => {
      return new Channel(this, this.store.getChannelById(id))
    })
  }

  getChannel (id) {
    const channel = this.store.getChannelGroupOrDMById(id)
    return channel ? new Channel(this, channel) : null
  }

  getChannelByName (name) {
    let channel
    if (name[0] === '@') {
      channel = this.store.getDMByName(name.slice(1))
      if (!channel) {
        channel = this.store.getBotByName(name.slice(1))
      }
    } else {
      channel = this.store.getChannelByName(name)
    }
    return channel ? new Channel(this, channel) : null
  }

  onMessage = (slackMessage) => {
    debug([slackMessage.type, slackMessage.subtype].filter(Boolean).join(':'), {
      user: slackMessage.user,
      ...slackMessage
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
    return text.trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<!channel>/g, '@channel')
      .replace(/<!group>/g, '@group')
      .replace(/<!everyone>/g, '@everyone')
      .replace(/<#(C\w+)\|?(\w+)?>/g, (_, channelId) => `#${this.getChannel(channelId).name}`)
      .replace(/<@(U\w+)\|?(\w+)?>/g, (_, userId) => `@${this.getUser(userId).name}`)
      .replace(/<(?!!)(\S+)>/g, (_, link) => link)
      .replace(/<!(\w+)\|?(\w+)?>/g, (_, command, label) => `<${label || command}>`)
  }
}
