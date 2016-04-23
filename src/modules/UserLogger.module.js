import { Module } from '../'
import User from '../models/User'

const debug = require('debug')('sekshi:user-logging')

export default class UserLogger extends Module {
  author = 'ReAnna'
  description = 'Keeps track of users who visit the channel.'

  constructor (bot, options) {
    super(bot, options)

    this.onUserJoin = this.onUserJoin.bind(this)
    this.onUserUpdate = this.onUserUpdate.bind(this)
  }

  init () {
    this.bot.on('user:join', this.onUserJoin)
    this.bot.on('user:update', this.onUserUpdate)

    const adapterNames = Object.keys(this.bot.adapters)
    const allUsers = adapterNames.reduce((users, name) => {
      return [...users, ...this.adapter(name).getUsers()]
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
    try {
      const userModel = await User.from(user)
      if (!userModel && user.source) {
        await User.create({
          adapter: user.source.constructor.adapterName,
          sourceId: user.id,
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
