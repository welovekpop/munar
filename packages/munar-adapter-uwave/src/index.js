import got from 'got'
import WebSocket from 'ws'
import { Adapter, User } from 'munar-core'

const debug = require('debug')('munar:adapter:uwave')

import Message from './Message'

export default class UwaveAdapter extends Adapter {
  static adapterName = 'uwave'

  users = []
  waitlist = []

  constructor (bot, options) {
    super(bot)

    this.options = options
    this.apiUrl = options.api.replace(/\/+$/, '')
  }

  // Base Adapter

  async connect () {
    await Promise.all([
      this.getNow(),
      this.connectSocket()
    ])
  }

  disconnect () {
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
  }

  async deleteMessage (id) {
    return await this.request('delete', `chat/${id}`)
  }

  // Local state

  getWaitlist () {
    return this.waitlist
  }

  toBotUser (user) {
    return new User(this, user._id, user.username, user)
  }

  // Sockets

  connectSocket () {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.options.socket)
      this.socket.on('open', () => {
        debug('send', this.options.token)
        this.socket.send(this.options.token)
        resolve()
      })
      this.socket.on('message', this.onSocketMessage)
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
    },

    waitlistUpdate (waitlist) {
      this.waitlist = waitlist
    },
    waitlistJoin ({ waitlist }) {
      this.waitlist = waitlist
    },
    waitlistLeave ({ waitlist }) {
      this.waitlist = waitlist
    },
    waitlistMove ({ waitlist }) {
      this.waitlist = waitlist
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

    if (command in this.socketHandlers) {
      this.socketHandlers[command].call(this, data)
    }
  }

  toString () {
    return 'üWave'
  }
}