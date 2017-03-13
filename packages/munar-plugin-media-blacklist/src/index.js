import { Plugin, command, permissions } from 'munar-core'
import Ultron from 'ultron'
import lockskip from 'munar-helper-booth-lockskip'
import BlacklistedMediaModel from './BlacklistedMedia'

function supportsBooth (adapter) {
  return typeof adapter.getDJBooth === 'function' &&
    typeof adapter.getDJBooth().getMedia === 'function'
}

export default class MediaBlacklist extends Plugin {
  static description = 'Blacklist media.'

  constructor (bot, options) {
    super(bot, options)

    this.models({
      BlacklistedMedia: BlacklistedMediaModel
    })
  }

  get User () {
    return this.model('User')
  }
  get BlacklistedMedia () {
    return this.model('BlacklistedMedia')
  }

  enable () {
    this.events = new Ultron(this.bot)
    this.events.on('djBooth:advance', this.onAdvance)
  }

  disable () {
    this.events.remove()
  }

  getBlacklistItem ({ sourceType, sourceID }) {
    return this.BlacklistedMedia.findOne({ sourceType, sourceID })
  }

  async createBlacklistItem (user, { sourceType, sourceID }, reason) {
    const userModel = await this.User.findOne(user.compoundId())
    return this.BlacklistedMedia.create({
      user: userModel.id,
      sourceType,
      sourceID,
      reason
    })
  }

  async addBlacklistItem (message, itemID = '', reason = '') {
    let item
    if (itemID && /^\w+:\w+$/.test(itemID)) {
      const [ sourceType, sourceID ] = itemID.split(':')
      item = { sourceType, sourceID }
    } else {
      if (!supportsBooth(message.source)) {
        throw new Error(
          'This adapter does not support retrieving the current media. ' +
          'You can still add media to the blacklist by using `!blacklist ' +
          'sourceType:sourceID`, for example `!blacklist youtube:QfUX9XcA7b4`.'
        )
      }

      reason = `${itemID} ${reason}`
      item = await message.source.getDJBooth().getMedia()
    }

    const blacklisted = await this.getBlacklistItem(item)
    if (blacklisted) {
      message.reply('That song was already blacklisted!')
      return
    }

    await this.createBlacklistItem(message.user, item, reason)

    message.reply(`Added "${item.sourceType}:${item.sourceID}" to the blacklist.`)
  }

  @command('blacklist', { role: permissions.MODERATOR })
  triageBlacklist (message, action, ...args) {
    if (action === 'add') {
      return this.addBlacklistItem(message, ...args)
    }

    throw new Error('Unknown blacklist command.')
  }

  onAdvance = async (adapter, { next }) => {
    const blacklisted = await this.getBlacklistItem(next)
    if (blacklisted) {
      const { username } = await adapter.getDJBooth().getDJ()
      adapter.send(
        `@${username} This song or video is blacklisted` +
        (blacklisted.reason ? `: ${blacklisted.reason}` : '.')
      )
      try {
        await lockskip(adapter, { position: 2 })
      } catch (e) {
        console.error(e.stack)
      }
    }
  }
}
