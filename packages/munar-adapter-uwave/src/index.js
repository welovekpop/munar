import got from 'got'
import WebSocket from 'ws'
import EventEmitter from 'events'
import { stringify } from 'qs'
import { Adapter, User, permissions } from 'munar-core'
import retrier from 'promise-retry'
import once from 'once'
import createDebug from 'debug'
import Message from './Message'
import Waitlist from './Waitlist'
import DJBooth from './DJBooth'
import DJHistory from './DJHistory'

const debug = createDebug('munar:adapter:uwave')

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
    if (!this.options.token) {
      const { body } = await this.request('post', 'auth/login', {
        email: this.options.email,
        password: this.options.password
      })
      if (body && body.meta && body.meta.jwt) {
        this.options.token = body.meta.jwt
      } else {
        throw new Error('Could not log in.')
      }
    }

    await retrier(async (retry, n) => {
      try {
        const state = await this.getNow()
        await this.connectSocket(state.socketToken)
      } catch (err) {
        debug('retry connect', err)
        retry(err)
      }
    })
  }

  async disconnect () {
    this.shouldClose = true
    this.socket.close()
    await this.request('delete', 'auth')
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

  canExecute (message, command) {
    const user = message.user.sourceUser
    const userRole = user.roles && user.roles.length > 0
      ? getRoleFromList(user.roles)
      : getRoleFromId(user.role)
    const requiredRole = command.role

    debug('canExecute', requiredRole, userRole, user.roles, user.role)

    return userRole >= requiredRole

    function getRoleFromList (list) {
      if (list.includes('*') || list.includes('admin')) return permissions.ADMIN
      if (list.includes('moderator')) return permissions.MODERATOR
      if (list.includes('special')) return permissions.REGULAR
      return permissions.NONE
    }
    function getRoleFromId (id) {
      if (id >= 4) return permissions.ADMIN
      if (id >= 2) return permissions.MODERATOR
      if (id === 1) return permissions.REGULAR
      return permissions.NONE
    }
  }

  // HTTP API

  request (method, endpoint, data) {
    let url = `${this.apiUrl}/${endpoint}`
    const options = {
      method,
      headers: {
        authorization: `JWT ${this.options.token}`
      },
      json: true
    }
    if (method === 'get') {
      options.query = data
    } else {
      options.body = data
    }
    // For nested query parameters (like page[offset])
    if (options.query) {
      options.query = stringify(options.query, { encode: false })
    }

    debug('request', url, options.query, options.body)
    return got(url, options)
  }

  async getNow () {
    const { body } = await this.request('get', 'now')
    this.users = body.users.map(this.toBotUser, this)
    this.self = this.toBotUser(body.user)
    this.waitlist.waitlist = body.waitlist
    return body
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

  async getSocketAuth () {
    const { body } = await this.request('get', 'auth/socket')
    return body.data.socketToken
  }
  async connectSocket (socketToken) {
    if (!socketToken) socketToken = await this.getSocketAuth()

    return await new Promise((resolve, reject) => {
      let sent = false
      debug('connecting socket', socketToken)
      this.socket = new WebSocket(this.options.socket)
      this.socket.on('open', () => {
        sent = true
        debug('send', socketToken)
        this.socket.send(socketToken)
        resolve()
      })
      this.socket.on('message', this.onSocketMessage)

      const reconnect = once(() => {
        debug('reconnecting in 1000ms')
        setTimeout(() => {
          this.connect()
        }, 1000)
      })

      this.socket.on('error', (err) => {
        debug(err)
        if (!sent) reject(err)
        else reconnect()
      })
      this.socket.on('close', () => {
        debug('closed')
        if (!this.shouldClose && sent) reconnect()
      })
    })
  }

  socketHandlers = {
    chatMessage (data) {
      const message = new Message(this, data, this.getUser(data.userID))
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
    // Ignore pings
    if (message === '-') {
      return
    }

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
