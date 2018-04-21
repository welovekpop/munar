import promisify from 'pify'
import Ultron from 'ultron'
import Plugged from 'plugged'
import { Adapter, User } from 'munar-core'

import Message from './PlugdjMessage'
import Waitlist from './Waitlist'
import DJBooth from './DJBooth'
import DJHistory from './DJHistory'

const debug = require('debug')('munar:adapter:plugdj')

export default class PlugdjAdapter extends Adapter {
  static adapterName = 'plugdj'

  plugged = new Plugged()

  constructor (bot, options) {
    super(bot)

    this.options = options
    this.events = new Ultron(this.plugged)

    this.plugged.invokeLogger((message) => debug(message))
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
    return new User(this, user.id, user.username, user)
  }

  // Base Adapter

  async connect () {
    this.events.on(this.plugged.USER_JOIN, this.onJoin)
    this.events.on(this.plugged.FRIEND_JOIN, this.onJoin)
    this.events.on(this.plugged.USER_LEAVE, this.onLeave)
    this.events.on(this.plugged.CHAT, this.onChat)

    await promisify(this.plugged.login).call(this.plugged, this.options)
    await promisify(this.plugged.connect).call(this.plugged, this.options.room)
  }

  disconnect = promisify(this.plugged.logout).bind(this.plugged)

  reply (message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send (text) {
    this.plugged.sendChat(text)
  }

  deleteMessage = promisify(this.plugged.removeChatMessage).bind(this.plugged)

  getSelf () {
    return this.toBotUser(this.plugged.getSelf())
  }

  getUsers () {
    return this.plugged.getUsers().map(this.toBotUser, this)
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
    const user = this.plugged.getUserById(message.id)
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
    const user = this.plugged.getUserById(id)
    if (user) {
      this.receive('user:leave', this.toBotUser(user))
    }
  }

  toString () {
    return 'plug.dj'
  }
}
