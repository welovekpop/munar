import got from 'got'
import WebSocket from 'ws'
import EventEmitter from 'events'
import { Adapter, User } from 'munar-core'

const debug = require('debug')('munar:adapter:uwave')

import Message from './Message'
import Waitlist from './Waitlist'
import DJBooth from './DJBooth'
import DJHistory from './DJHistory'

export default class UwaveAdapter extends Adapter {
  static adapterName = 'uwave'

  users = []
  socketEvents = new EventEmitter()

  constructor (bot, options) {
    super(bot)

    this.options = options
    this.apiUrl = options.api.replace(/\/+$/, '')

    this.waitlist = new Waitlist(this)
    this.djBooth = new DJBooth(this)
    this.djHistory = new DJHistory(this)
  }

  // Base Adapter

  async connect () {
    this.shouldClose = false
    await Promise.all([
      this.getNow(),
      this.connectSocket()
    ])
  }

  disconnect () {
    this.shouldClose = true
    this.socket.close()
  }

  reply (message, text) {
    this.send(`@${message.username} ${text}`)
  }

  send (text) {
    const message = JSON.stringify({
      command: 'sendChat',
      data: text
    })
    this.socket.send(message)
  }

  getSelf () {
    return this.self
  }

  getUsers () {
    return this.users
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

  // HTTP API

  request (method, endpoint, data) {
    let url = `${this.apiUrl}/${endpoint}`
    const options = {
      method,
      query: { token: this.options.token },
      json: true
    }
    if (method === 'get') {
      Object.assign(options.query, data)
    } else {
      options.body = JSON.stringify(data)
      options.headers = {
        'content-type': 'application/json'
      }
    }
    return got(url, options)
  }

  async getNow () {
    const { body } = await this.request('get', 'now')
    this.users = body.users.map(this.toBotUser, this)
    this.self = this.toBotUser(body.user)
    this.waitlist.waitlist = body.waitlist
  }

  async deleteMessage (id) {
    return await this.request('delete', `chat/${id}`)
  }

  // Local state

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
    return new User(this, user._id, user.username, user)
  }

  // Sockets

  connectSocket () {
    return new Promise((resolve, reject) => {
      debug('connecting socket')
      this.socket = new WebSocket(this.options.socket)
      this.socket.on('open', () => {
        debug('send', this.options.token)
        this.socket.send(this.options.token)
        resolve()
      })
      this.socket.on('message', this.onSocketMessage)

      let reconnecting = false
      const reconnect = () => {
        if (reconnecting) return
        reconnecting = true
        debug('reconnecting in 1000ms')
        setTimeout(() => this.connectSocket(), 1000)
      }

      this.socket.on('error', reconnect)
      this.socket.on('close', () => {
        if (!this.shouldClose) reconnect()
      })
    })
  }

  socketHandlers = {
    chatMessage (data) {
      const message = new Message(this, data, this.getUser(data._id))
      this.receive('message', message)
    },
    join (user) {
      const botUser = this.toBotUser(user)
      this.users.push(botUser)
      this.receive('user:join', botUser)
    },
    leave (userID) {
      const user = this.users.find((user) => user.id === userID)
      this.users = this.users.filter((user) => user.id !== userID)
      this.receive('user:leave', user)
    },
    nameChange ({ userID, username }) {
      const user = this.getUser(userID)
      user.username = username
      user.sourceUser.username = username

      this.receive('user:update', user, { username })
    },
    roleChange ({ userID, role }) {
      const user = this.getUser(userID)
      user.sourceUser.role = role

      this.receive('user:update', user, { role })
    }
  }

  onSocketMessage = (message) => {
    let command
    let data

    try {
      ({ command, data } = JSON.parse(message))
    } catch (e) {
      console.error(e.stack || e)
      return
    }

    this.socketEvents.emit(command, data)
    if (command in this.socketHandlers) {
      this.socketHandlers[command].call(this, data)
    }
  }

  toString () {
    return 'üWave'
  }
}
