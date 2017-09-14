import { Plugin } from 'munar-core'

const debug = require('debug')('munar:user-log')

export default class UserLog extends Plugin {
  static description = 'Keeps track of users who visit the channel.'

  constructor (bot, options) {
    super(bot, options)

    this.onUserJoin = this.onUserJoin.bind(this)
    this.onUserUpdate = this.onUserUpdate.bind(this)
  }

  async enable () {
    this.bot.on('user:join', this.onUserJoin)
    this.bot.on('user:update', this.onUserUpdate)

    const allUsers = this.bot.adapters.reduce((users, adapter) => {
      return [...users, ...adapter.getUsers()]
    }, [])

    try {
      await Promise.all(
        allUsers.map((user) =>
          this.onUserJoin(user.source, user)
        )
      )
    } catch (error) {
      console.error('Could not register all joined users')
      console.error(error.stack)
    }
  }

  disable () {
    this.bot.removeListener('user:join', this.onUserJoin)
    this.bot.removeListener('user:update', this.onUserUpdate)
  }

  async onUserJoin (adapter, user) {
    debug('join', `${user.username} (${user.id})`)
    const User = this.model('User')
    if (!adapter) {
      return
    }
    try {
      const userModel = await User.from(user)
      if (!userModel) {
        await User.create({
          ...user.compoundId(),
          username: user.username
        })
      } else if (userModel.username !== user.username) {
        await userModel.update({
          username: user.username
        })
      }
    } catch (e) {
      console.error(e.stack || e)
    }
  }

  async onUserUpdate (adapter, user, update) {
    if (!user) return

    const User = this.model('User')
    debug('update', update)

    if (update.username) {
      const userModel = await User.from(user)
      if (userModel) {
        await userModel.update({
          username: user.username
        })
      }
    }
  }
}
