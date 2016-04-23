import { Module, command } from '../'
import Media from '../models/Media'
import mongoose from 'mongoose'

const bannedMediaSchema = {
  format: Number,
  cid: String,
  reason: String,
  time: { type: Date, default: Date.now },
  moderator: { type: Number, ref: 'User' }
}
const BannedMedia = mongoose.modelNames().indexOf('BannedMedia') === -1
  ? mongoose.model('BannedMedia', bannedMediaSchema)
  : mongoose.model('BannedMedia')

export default class SongBan extends Module {
  author = 'ReAnna'
  description = 'Bans songs from being played ever again.'

  BannedMedia = BannedMedia

  init () {
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }
  destroy () {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance = (booth, { media }) => {
    BannedMedia.findOne({ cid: media.cid, format: media.format }).exec()
      .then((banned) => {
        const modSkip = this.bot.getPlugin('modskip')
        if (banned && modSkip) {
          modSkip.lockskip(
            this.bot.getSelf(),
            banned.reason || 'This song was blacklisted.'
          )
        }
      })
  }

  @command('songban', 'bansong', { role: command.ROLE.BOUNCER })
  songban (message, cid, ...reason) {
    Media.findOne({ cid: cid })
      .then((media) => {
        if (!media) {
          reason.unshift(cid)
          return this.bot.getCurrentMedia()
        }
        return media
      })
      .then((media) => {
        return BannedMedia.create({
          format: media.format,
          cid: media.cid,
          reason: reason.join(' '),
          moderator: message.user.id
        }).then((banned) => {
          if (media && media.author) {
            message.reply(`${media.author} - ${media.title} is now blacklisted.`)
          } else {
            message.reply('That song is now blacklisted.')
          }
        })
      })
  }

  @command('songunban', 'unbansong', { role: command.ROLE.BOUNCER })
  songunban (message, cid) {
    BannedMedia.findOne({ cid: cid }).exec()
      .then((banned) => {
        if (banned) BannedMedia.remove({ _id: banned._id })
      })
  }

  @command('banskip', 'bs', { role: command.ROLE.BOUNCER })
  banskip (message, ...reason) {
    const modSkip = this.bot.getPlugin('modskip')
    if (modSkip) {
      modSkip.skip(message, ...reason)
    }
    setTimeout(() => {
      this.songban(message, ...reason)
    }, 300)
  }
}
