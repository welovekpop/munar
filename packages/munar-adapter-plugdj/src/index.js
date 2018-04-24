import Ultron from 'ultron'
import miniplug from 'miniplug'
import { Adapter, User } from 'munar-core'
import Message from './PlugdjMessage'
import Waitlist from './Waitlist'
import DJBooth from './DJBooth'
import DJHistory from './DJHistory'

const debug = require('debug')('munar:adapter:plugdj')

export default class PlugdjAdapter extends Adapter {
  static adapterName = 'plugdj'

  mp = miniplug({ connect: false })

  constructor (bot, options) {
    super(bot)

    this.options = options
    this.events = new Ultron(this.mp)

    this.waitlist = new Waitlist(this)
    this.djBooth = new DJBooth(this)
    this.djHistory = new DJHistory(this)
  }

  getWaitlist () {
    return this.waitlist
  }

  getDJBooth () {
    return this.djBooth
  }

  getDJHistory () {
    return this.djHistory
  }

  toBotUser (user) {
    debug('toBotUser', user.id, user.username)
    return new User(this, user.id, user.username, user)
  }

  // Base Adapter

  async connect () {
    this.events.on('userJoin', this.onJoin)
    this.events.on('userLeave', this.onLeave)
    this.events.on('chat', this.onChat)

    await this.mp.connect({
      email: this.options.email,
      password: this.options.password
    })
    await this.mp.join(this.options.room)
  }

  async disconnect () {
    this.mp.ws.close()
  }

  reply (message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send (text) {
    this.mp.chat(text)
  }

  deleteMessage = this.mp.deleteChat

  getSelf () {
    return this.toBotUser(this.mp.me())
  }

  getUsers () {
    return this.mp.users()
      .map(this.toBotUser, this)
  }

  getChannels () {
    return [this]
  }

  getChannel (str) {
    if (str !== 'main') {
      throw new Error(`Channel ${str} does not exist`)
    }
    return this
  }

  canExecute () {
    return true
  }

  onChat = (message) => {
    const { user } = message
    this.receive('message',
      new Message(this, message, user && this.toBotUser(user))
    )
  }

  onJoin = (user) => {
    if (user) {
      this.receive('user:join', this.toBotUser(user))
    }
  }

  onLeave = (id) => {
    const user = this.mp.user(id)
    if (user) {
      this.receive('user:leave', this.toBotUser(user))
    }
  }

  toString () {
    return 'plug.dj'
  }
}
