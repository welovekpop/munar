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
          'You can still add media to the blacklist by using `!blacklist add ' +
          'sourceType:sourceID`, for example `!blacklist add youtube:QfUX9XcA7b4`.'
        )
      }

      reason = `${itemID} ${reason}`
      item = await message.source.getDJBooth().getMedia()
    }

    if (!item) {
      throw new Error(
        'No media is currently being played. ' +
        'You can still add specific media to the blacklist by using ' +
        '`!blacklist add sourceType:sourceID`, for example ' +
        '`!blacklist add youtube:QfUX9XcA7b4`.'
      )
    }

    const blacklisted = await this.getBlacklistItem(item)
    if (blacklisted) {
      message.reply('That song was already blacklisted!')
      return
    }

    await this.createBlacklistItem(message.user, item, reason)

    message.reply(`Added "${item.sourceType}:${item.sourceID}" to the blacklist.`)
  }

  async removeBlacklistItem (message, itemID) {
    if (!itemID || !itemID.includes(':')) {
      throw new Error(
        'You must provide a media item to remove from the blacklist. Use ' +
        '`!blacklist remove sourceType:sourceID`, for example ' +
        '`!blacklist remove youtube:QfUX9XcA7b4`.'
      )
    }

    const [ sourceType, sourceID ] = itemID.split(':')
    const item = { sourceType, sourceID }

    const blacklisted = await this.getBlacklistItem(item)
    if (!blacklisted) {
      message.reply('That media is not blacklisted.')
      return
    }

    await blacklisted.remove()

    message.reply(`Removed "${item.sourceType}:${item.sourceID}" from the blacklist.`)
  }

  async addBlacklistItemAndSkip (message, reason) {
    if (!supportsBooth(message.source)) {
      throw new Error('This adapter does not support skipping.')
    }
    await this.addBlacklistItem(message, null, reason)
    try {
      await lockskip(message.source, { position: 2, reason })
    } catch (err) {
      message.reply('Could not force skip, please do it manually!')
    }
    return null
  }

  @command('blacklist', { role: permissions.MODERATOR })
  async triageBlacklist (message, action, ...args) {
    if (action === 'skip') {
      return this.addBlacklistItemAndSkip(message, args[0])
    }

    if (action === 'add') {
      return this.addBlacklistItem(message, ...args)
    }

    if (action === 'remove') {
      return this.removeBlacklistItem(message, ...args)
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
