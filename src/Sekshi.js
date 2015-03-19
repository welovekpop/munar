const Plugged = require('plugged')
const path = require('path')
const { inherits } = require('util')
const fs = require('fs')
const debug = require('debug')('sekshi:sekshi')
const logChat = require('debug')('sekshi:chat')
const mongoose = require('mongoose')
const Promise = require('promise')
const { User } = require('./models')
const find = require('array-find')
const unescape = require('ent/decode')

// these are fine-tuned to fit pretty much exactly within plug.dj's rate limiting scheme,
// while also being really simple
const CHAT_INTERVAL = 150
const CHAT_BACKOFF_INC = 60
const CHAT_BACKOFF_MAX = 700

export default class Sekshi extends Plugged {
  constructor(args) {
    super()
    this.invokeLogger(this._log)

    this.options = args
    this.db = mongoose.connect(args.mongo)

    this.modules = {}
    this._availableModules = []
    this.delimiter = args.delimiter || '!'
    this.modulePath = args.modulePath || path.join(__dirname, 'modules')

    this._room = args.room

    this.onMessage = this.onMessage.bind(this)

    this._addUnescapeListeners()

    this._chatQueue = []
    this._lastMessage = 0
    this._chatTimer = false
    this._chatBackoff = CHAT_INTERVAL
  }

  _log(msg, verbosity, color) {
    debug(msg)
  }

  // ugly hack to deal with plug.dj's mildly insane html escaping behaviour
  _addUnescapeListeners() {
    const unescapeUser = user => {
      user.username = unescape(user.username)
      user.blurb && (user.blurb = unescape(user.blurb))
    }

    // these handlers are added before any other handlers,
    // hopefully EventEmitter will always fire them in
    // that same order!
    this.on(this.USER_JOIN, unescapeUser)
    this.on(this.ADVANCE, ({}, { media }) => {
      media.author = unescape(media.author)
      media.title = unescape(media.title)
    })
    this.on(this.CHAT, chat => {
      chat.username = unescape(chat.username)
      chat.message = unescape(chat.message)
    })
    this.on(this.JOINED_ROOM, () => {
      this.state.room.users.forEach(unescapeUser)
    })
  }

  // Override Plugged#getUserByName with a case insensitive version
  getUserByName(username, checkCache = false) {
    username = username.toLowerCase()

    if (username === this.getSelf().username.toLowerCase())
      return this.getSelf()

    let user = find(this.getUsers(), user => user.username.toLowerCase() === username)

    if (checkCache && !user) {
      user = find(this.state.usercache, user => user.username.toLowerCase() === username)
    }

    return user || null
  }

  sendChat(message, autodelete = false) {
    const MAX_LENGTH = 256
    while (message.length >= MAX_LENGTH) {
      this._chatQueue.push([ message.slice(0, MAX_LENGTH), autodelete ])
      message = message.slice(MAX_LENGTH)
    }
    this._chatQueue.push([ message, autodelete ])
    if (!this._chatTimer) {
      this._processChatQueue()
    }
  }

  _processChatQueue() {
    if (this._chatQueue.length > 0) {
      if (this._lastMessage + this._chatBackoff <= Date.now()) {
        Plugged.prototype.sendChat.call(this, ...this._chatQueue.shift())
        this._lastMessage = Date.now()
        if (this._chatBackoff < CHAT_BACKOFF_MAX) {
          this._chatBackoff += CHAT_BACKOFF_INC
        }
      }
      setTimeout(() => this._processChatQueue(), this._chatBackoff + 1)
      this._chatTimer = true
    }

    if (this._chatQueue.length === 0) {
      this._chatTimer = false
      this._chatBackoff = CHAT_INTERVAL
    }
  }

  start(creds, cb) {
    this.login(creds)

    this.once(this.LOGIN_SUCCESS, () => {
      this.cacheChat(true)
      this.connect(this.options.room)
      this.loadModules()
    })

    this.on(this.CHAT, this.onMessage)

    this.once(this.JOINED_ROOM, err => {
      if (!err) {
        // ensure that users who are already online are entered into the
        // database
        // TODO move to UserLogger module
        Promise.all(this.getUsers().map(user => User.fromPlugUser(user)))
          .then(users => { debug('updated users', users.length) })
      }
      cb && cb(err)
    })
  }

  stop(cb) {
    this.unloadModules()
    this.logout()
    // should *probably* also wait for this before callback-ing
    mongoose.disconnect()

    this.once(this.LOGOUT_SUCCESS, () => {
      this.removeAllListeners()
      cb()
    })
    this.once(this.LOGOUT_ERROR, e => {
      // TODO figure out something useful to do here
      this.removeAllListeners()
      cb(e)
    })
  }

  setRoom(room) {
    this.options.room = room
    this.connect(room)
  }

  onMessage(msg) {
    if (!this.getCurrentRoomStats()) {
      return
    }

    logChat(msg.username, msg.message)
    if (msg.message.charAt(0) === this.delimiter) {
      let func = null
      let user = msg.id === 'sekshi' ? { role: this.USERROLE.HOST }
                                     : this.getUserByID(msg.id, true)

      // nonexistent user
      if (!user) return

      user.role = user.role || this.USERROLE.NONE

      let args = this.parseArguments(msg.message)

      func = args.shift().replace(this.delimiter, '').toLowerCase()
      args.unshift(user)

      for (let name in this.modules) if (this.modules.hasOwnProperty(name)) {
        let mod = this.modules[name]
        if (mod.enabled() && typeof mod[func] === 'function' && mod.permissions.hasOwnProperty(func)) {
          if (mod.ninjaVanish.indexOf(func) !== -1) {
            this.deleteMessage(msg.cid)
          }
          if (user.role >= mod.permissions[func]) {
            mod[func](...args)
          }
          else {
            this.sendChat(`@${msg.username}: You don't have sufficient permissions to use this command.`, 5 * 1000)
          }
        }
      }
    }
  }

  // Parses space-separated chat command arguments.
  // single words become single arguments.
  //    word → [ 'word ']
  // strings surrounded by double quotes become single arguments.
  //    "quoted words" word → [ 'quoted words', 'word' ]
  // strings prefixed with "@" are matched to the online user list.
  // if any online user's name matches the string, it will be passed instead.
  // this is so that you don't need quotes around usernames with spaces.
  //    @Online User parameter @Offline User → [ 'Online User', 'parameter', '@Offline', 'User' ]
  //
  // feature-bugs:
  // if you forget to close a quoted string it will go until the end of the line (might be unexpected)
  // if you forget to add a space after a quoted string, the rest will be read as a separate parameter
  parseArguments(str = '') {
    let args = []
    let i = 0
    let chunk

    let usernames = str.indexOf('@') !== -1 // might contain a username
      ? [ this.getSelf(), ...this.getUsers() ].map(u => u.username)
      : []

    while (chunk = str.slice(i)) {
      // separator
      if (chunk.charAt(0) === ' ') {
        i++
        continue
      }
      // quoted string
      else if (chunk.charAt(0) === '"') {
        let end = chunk.indexOf('"', 1)
        // end of param string
        if (end === -1) {
          args.push(chunk.slice(1))
          break
        }
        args.push(chunk.slice(1, end))
        i += end + 1
        continue
      }
      // possible username
      else if (chunk.charAt(0) === '@') {
        let username = find(usernames,
                            name => chunk.slice(1, name.length + 1).toLowerCase() === name.toLowerCase())
        if (username) {
          args.push(username)
          i += `@${username}`.length
          continue
        }
      }
      // single parameter word
      let end = chunk.indexOf(' ')
      // end of param string
      if (end === -1) {
        args.push(chunk)
        break
      }
      args.push(chunk.slice(0, end))
      i += end + 1
      continue
    }

    return args
  }

  lockskipDJ(id, position, cb) {
    this.skipDJ(id, e => {
      if (e) cb && cb(e)
      else this.moveDJ(id, position, cb)
    })
  }

  getModule(name) {
    return this.modules[name.toLowerCase()]
  }

  _getModuleFiles(modulePath) {
    const stat = fs.statSync(modulePath)
    if (stat.isDirectory()) {
      let files = fs.readdirSync(modulePath)
      return files.reduce((modules, filename) => {
        return modules.concat(this._getModuleFiles(path.join(modulePath, filename)))
      }, [])
    }
    else if (stat.isFile() && /\.module\.js$/.test(modulePath)) {
      return [ modulePath ]
    }
    return []
  }

  updateAvailableModules() {
    return this._availableModules = this._getModuleFiles(this.modulePath)
      .map(file => file.match(/\/([^\/]+?)\.module\.js$/)[1])
  }

  getAvailableModules() {
    return this._availableModules
  }

  // finds the file path for the given module name, case-insensitive
  getModulePath(name) {
    const lower = name.toLowerCase()
    const match = find(this.getAvailableModules(), avail => avail.toLowerCase() === lower)
    return match ? path.join(this.modulePath, `${match}.module.js`) : null
  }

  enable(name) {
    debug('enable', name)
    const mod = this.getModule(name)
    if (mod) mod.enable()
  }
  disable(name) {
    debug('disable', name)
    const mod = this.getModule(name)
    if (mod) mod.disable()
  }

  loadModule(name) {
    debug('load', name)
    const lName = name.toLowerCase()
    let mod = this.modules[lName]
    if (!mod) {
      const Module = require(this.getModulePath(name))
      mod = new Module(this, {})
      this.modules[lName] = mod
    }

    // the event is fired on nextTick so modules can simply listen for "moduleloaded"
    // and get events for *all* the modules when loadModules() is called, even for those
    // that register earlier
    process.nextTick(() => { this.emit('moduleloaded', mod, lName) })

    // enable system modules by default
    if (lName === 'system' || lName === 'config') mod.enable()

    return mod
  }

  unloadModule(name) {
    debug('unload', name)
    const mod = this.getModule(name)
    if (mod) {
      mod.destroy()
    }
    const file = this.getModulePath(name)
    delete require.cache[path.resolve(file)]
    delete this.modules[name.toLowerCase()]

    process.nextTick(() => { this.emit('moduleunloaded', mod, name.toLowerCase()) })
  }

  reloadModule(name) {
    let mod = this.getModule(name)
    let enabled = false
    if (mod) {
      enabled = mod.enabled()
      mod = null
    }

    this.unloadModule(name)
    this.loadModule(name)

    if (enabled) {
      this.getModule(name).enable()
    }
  }

  loadModules() {
    debug('load all')
    this.updateAvailableModules()
    this.getAvailableModules().forEach(this.loadModule, this)
  }

  unloadModules() {
    debug('unload all')
    for (let name in this.modules) if (this.modules.hasOwnProperty(name)) {
      this.unloadModule(name)
    }
  }

  reloadModules() {
    this.unloadModules()
    this.loadModules()
  }
}