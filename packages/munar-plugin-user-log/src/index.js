import { Plugin } from 'munar-core'

const debug = require('debug')('munar:user-log')

export default class UserLog extends Plugin {
  static description = 'Keeps track of users who visit the channel.'

  constructor (bot, options) {
    super(bot, options)

    this.onUserJoin = this.onUserJoin.bind(this)
    this.onUserUpdate = this.onUserUpdate.bind(this)
  }

  init () {
    this.bot.on('user:join', this.onUserJoin)
    this.bot.on('user:update', this.onUserUpdate)

    const allUsers = this.bot.adapters.reduce((users, adapter) => {
      return [...users, ...adapter.getUsers()]
    }, [])

    Promise.all(allUsers.map(this.onUserJoin)).catch((error) => {
      console.error('Could not register all joined users')
      console.error(error.stack)
    })
  }

  destroy () {
    this.bot.removeListener('user:join', this.onUserJoin)
    this.bot.removeListener('user:update', this.onUserUpdate)
  }

  async onUserJoin (user) {
    debug('join', `${user.username} (${user.id})`)
    const User = this.model('User')
    try {
      const userModel = await User.from(user)
      if (!userModel && user.source) {
        await User.create({
          ...user.compoundId(),
          username: user.username
        })
      }
    } catch (e) {
      console.error(e.stack || e)
    }
  }

  async onUserUpdate (user, update) {
    if (!user) return
    debug('update', update)
  }
}
