import EventEmitter from 'events'

function unimplemented (adapter, method) {
  const { adapterName } = adapter.constructor
  throw new Error(`Adapter "${adapterName}" does not implement the "${method}" method.`)
}

export default class Adapter extends EventEmitter {
  constructor (bot) {
    super()

    this.bot = bot
  }

  /**
   * Connect to the adapter source.
   */
  async connect () {
    unimplemented(this, 'connect')
  }

  /**
   * Disconnect from the adapter source.
   */
  async disconnect () {
    unimplemented(this, 'disconnect')
  }

  receive (event, ...args) {
    this.bot.receive(this, event, args)
  }

  /**
   * Get an array containing all currently online users.
   */
  getUsers () {
    unimplemented(this, 'getUsers')
  }

  /**
   * Get an array containing all known channels.
   */
  getChannels () {
    unimplemented(this, 'getChannels')
  }

  getUser (id) {
    const users = this.getUsers()
    return users.find((user) => user.id === id)
  }

  getUserByName (name) {
    name = name.toLowerCase()
    const users = this.getUsers()
    return users.find((user) => user.username.toLowerCase() === name)
  }

  getAdapterName () {
    return this.constructor.adapterName
  }

  getSource () {
    return this
  }
}
