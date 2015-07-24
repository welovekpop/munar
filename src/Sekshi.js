const Plugged = require('plugged')
const path = require('path')
const { inherits } = require('util')
const fs = require('fs')
const debug = require('debug')('sekshi:sekshi')
const logChat = require('debug')('sekshi:chat')
const mongoose = require('mongoose')
const Promise = require('bluebird')
const find = require('array-find')
const mkdirp = require('mkdirp')
const { User } = require('./models')
const commandsSymbol = require('./command').symbol

mongoose.Promise = Promise

export default class Sekshi extends Plugged {
  constructor(args) {
    super()
    this.invokeLogger(this._debug)

    this.options = args
    this.db = mongoose.connect(args.mongo)

    this.modules = {}
    this._availableModules = []
    this.delimiter = args.delimiter || '!'
    this.modulePath = args.modulePath || path.join(__dirname, 'modules')

    this._room = args.room
    this._configDir = path.join(__dirname, '../.config')

    this.onMessage = this.onMessage.bind(this)
    this.onUserUpdate = this.onUserUpdate.bind(this)
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
    this.on(this.USER_UPDATE, this.onUserUpdate)

    this.once(this.JOINED_ROOM, (room) => {
      mkdirp(this._configDir, (e) => {
        if (cb) cb(e || null, room || null)
      })
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

  // updates user name, avatar and level
  onUserUpdate(update) {
    const user = this.getUserByID(update.id)
    if (!user) return
    User.findById(user.id).exec().then(model => {
      if (!model) return
      if (update.level) {
        user.level = update.level
        model.set('level', update.level)
      }
      if (update.avatarID) {
        user.avatarID = update.avatarID
        model.set('avatar', update.avatarID)
      }
      if (update.username) {
        user.username = update.username
        model.set('username', update.username)
      }
      model.save()
    })
  }

  onMessage(msg) {
    if (!this.getCurrentRoomStats()) {
      return
    }

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

      for (let name in this.modules) if (this.modules.hasOwnProperty(name)) {
        let mod = this.modules[name]
        if (!mod.enabled() || !Array.isArray(mod[commandsSymbol])) continue

        let command = find(mod[commandsSymbol], com => includes(com.names, commandName))
        if (!command) continue

        if (command.ninjaVanish) {
          this.deleteMessage(msg.cid)
        }
        if (user.role >= command.role) {
          mod[command.method](user, ...args)
        }
        else {
          this.sendChat(`@${msg.username}: You don't have sufficient permissions to use this command.`, 5 * 1000)
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
      this.updateAvailableModules()
      const Module = require(this.getModulePath(name))
      mod = new Module(this, path.join(this._configDir, `${lName}.json`))
      this.modules[lName] = mod
    }

    // the event is fired on nextTick so modules can simply listen for "moduleloaded"
    // and get events for *all* the modules when loadModules() is called, even for those
    // that register earlier
    process.nextTick(() => { this.emit('moduleloaded', mod, lName) })

    // enable system modules by default
    if (lName === 'system' || mod.getOption('$enabled')) {
      mod.enable({ silent: true })
    }

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

  getConfigDir() {
    return this._configDir
  }
}
