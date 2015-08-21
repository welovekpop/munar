const Plugged = require('plugged')
const path = require('path')
const fs = require('fs')
const debug = require('debug')('sekshi:sekshi')
const logChat = require('debug')('sekshi:chat')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const find = require('array-find')
const includes = require('array-includes')
const mkdirp = require('mkdirp')
const { User } = require('./models')
const commandsSymbol = require('./command').symbol
const ModuleManager = require('./ModuleManager')
const { splitMessageSemiProperlyMaybe } = require('./utils')
const quote = require('regexp-quote')

mongoose.Promise = Promise

export default class Sekshi extends Plugged {
  constructor(args) {
    super({ messageProc: splitMessageSemiProperlyMaybe })
    this.invokeLogger(this._debug)

    this.options = args
    this.db = mongoose.connect(args.mongo)

    this.modules = new ModuleManager(this, path.join(__dirname, 'modules'))
    this.delimiter = args.delimiter || '!'

    this._room = args.room
    this._configDir = path.join(__dirname, '../.config')

    this.onMessage = this.onMessage.bind(this)
  }

  _debug(msg, verbosity, color) {
    debug(msg)
  }

  start(creds, cb) {
    this.login(creds)

    this.once(this.LOGIN_SUCCESS, () => {
      this.cacheChat(true)
      this.connect(this.options.room)
      this.loadModules()
    })

    this.on(this.CHAT, this.onMessage)

    this.once(this.JOINED_ROOM, (room) => {
      mkdirp(this._configDir, (e) => {
        if (cb) cb(e || null, room || null)
      })
    })

    // the event is fired on nextTick so modules can simply listen for "moduleloaded"
    // and get events for *all* the modules when loadModules() is called, even for those
    // that register earlier
    this.modules.on('load', (mod, name) => {
      setImmediate(() => { this.emit('moduleloaded', mod, name) })
    })
    this.modules.on('unload', (mod, name) => {
      setImmediate(() => { this.emit('moduleunloaded', mod, name) })
    })
  }

  stop(cb) {
    this.unloadModules()
    this.logout()
    // should *probably* also wait for this before callback-ing
    mongoose.disconnect()

    this.once(this.LOGOUT_SUCCESS, () => {
      this.removeAllListeners()
      if (cb) {
        cb()
      }
    })
    this.once(this.LOGOUT_ERROR, e => {
      // TODO figure out something useful to do here
      this.removeAllListeners()
      if (cb) {
        cb(e)
      }
    })
  }

  setRoom(room) {
    this.options.room = room
    this.connect(room)
  }

  // Find a user model or default to something.
  // Useful for commands that can optionally take a target user.
  findUser(name, _default = null) {
    if (!name) {
      return _default
        ? Promise.resolve(_default)
        : Promise.reject(new Error('No user given'))
    }

    let promise
    let user = this.getUserByName(name)
    if (user) {
      promise = User.findById(user.id)
    }
    else {
      let rx = new RegExp(`^${quote(name)}$`, 'i')
      promise = User.findOne({ username: rx })
    }
    return promise.then(user => {
      return user || Promise.reject(new Error('User not found'))
    })
  }

  onMessage(msg) {
    if (!this.getCurrentRoomStats()) {
      return
    }
    if (this.getSelf().id === msg.uid) {
      return
    }

    msg.message = msg.message.replace(/\\"/g, '"')

    logChat(msg.username, msg.message)
    if (msg.message.charAt(0) === this.delimiter) {
      let user = msg.id === 'sekshi' ? { role: this.USERROLE.HOST }
                                     : this.getUserByID(msg.id, true)

      // nonexistent user
      if (!user) return
      // Somehow plug decided to not handle chat levels on the server side, so if people
      // work around the client side chat level restriction, we can still get messages
      // from people whose level is below the minimum chat level for the room -.-
      if ('level' in user && user.level < this.getRoomMeta().minChatLevel) {
        return
      }

      user.role = user.role || this.USERROLE.NONE

      let args = this.parseArguments(msg.message)

      let commandName = args.shift().replace(this.delimiter, '').toLowerCase()

      this.modules.loaded().forEach(name => {
        let mod = this.modules.get(name)
        if (!mod) return
        if (!mod.enabled() || !Array.isArray(mod.commands)) return

        let command = find(mod.commands, com => includes(com.names, commandName))
        if (!command) return

        if (command.ninjaVanish) {
          this.deleteMessage(msg.cid)
        }
        if (user.role >= command.role) {
          if (command.method) {
            mod[command.method](user, ...args)
          }
          else {
            command.callback.call(mod, user, ...args)
          }
        }
        else {
          this.sendChat(`@${msg.username}: You don't have sufficient permissions to use this command.`, 5 * 1000)
        }
      })
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
      ? [ this.getSelf(), ...this.getUsers() ]
          .map(u => u.username)
          // longest usernames first
          .sort((a, b) => a.length > b.length ? -1 : 1)
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
    const skipDJ = Promise.promisify(this.skipDJ, this)
    const addToWaitlist = Promise.promisify(this.addToWaitlist, this)
    const moveDJ = Promise.promisify(this.moveDJ, this)
    const setLock = Promise.promisify(this.setLock, this)

    if (this.doesWaitlistCycle()) {
      skipDJ(id)
        .then(() => moveDJ(id, position))
        .nodeify(cb)
    }
    else {
      let locked = this.isWaitlistLocked()
      // DJ cycle is off
      // first, lock the wait list so no-one can steal the 50th spot before the DJ is put back
      setLock(true, false)
        // then skip & add the DJ again
        .then(() => skipDJ(id))
        .then(() => addToWaitlist(id))
        .then(() => moveDJ(id, position))
        // and finally revert to the old wait list lock status
        .then(() => setLock(locked, false),
              () => setLock(locked, false))
        .nodeify(cb)
    }
  }

  getModule(name) {
    return this.modules.get(name)
  }

  loadModules() {
    debug('load all')
    this.modules.update()
      .each(name => this.modules.load(name))
  }

  unloadModules() {
    debug('unload all')
    this.modules.loaded()
      .forEach(name => this.modules.unload(name))
  }

  getConfigDir() {
    return this._configDir
  }
}
