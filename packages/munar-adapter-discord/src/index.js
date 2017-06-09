import { Adapter } from 'munar-core'
import Eris from 'eris'
import tsml from 'tsml'
import createDebug from 'debug'
import Channel from './Channel'
import Message from './Message'
import User from './User'

const debug = createDebug('munar:adapter:discord')

export default class Discord extends Adapter {
  constructor (bot, options) {
    super(bot)

    if (typeof options.guild === 'number') {
      throw new TypeError(tsml`
        discord: Expected \`guild\` option to be a string, but got a number.
        While Discord guild IDs are numeric, they are too large to be represented accurately in JavaScript.
      `)
    }

    this.options = options
  }

  async connect () {
    this.client = new Eris(this.options.token)

    this.client.on('messageCreate', this.onMessage)

    const ready = new Promise((resolve) => {
      this.client.on('ready', resolve)
    })

    await this.client.connect()
    debug('connected')
    await ready
  }

  disconnect () {
    this.client.disconnect()
    this.client = null
  }

  onMessage = (message) => {
    debug('message', message.channel.name, message.author.username, message.content)
    const channel = this.getChannel(message.channel.id)
    this.receive('message', new Message(channel, message.content, message))
  }

  get guild () {
    return this.client.guilds.find((guild) => guild.id === String(this.options.guild))
  }

  getChannels () {
    return this.guild.channels.map((channel) => this.getChannel(channel.id))
  }

  getChannel (id) {
    const channel = this.client.getChannel(id)
    return channel ? new Channel(this, channel) : null
  }

  getChannelByName (name) {
    const channel = this.guild.channels.find((channel) => channel.name === name)
    return channel ? new Channel(this, channel) : null
  }

  getUsers () {
    return this.guild.members.map((member) => new User(this, member))
  }
  getUser (id) {
    const user = this.guild.members.find((member) => member.id === id)
    return user ? new User(this, user) : null
  }
  getUserByName (name) {
    const user = this.guild.members.find((member) => member.name === name)
    return user ? new User(this, user) : null
  }
}
