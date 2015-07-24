const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:song-ban')
const moment = require('moment')
const mongoose = require('mongoose')

const BannedMedia = mongoose.modelNames().indexOf('BannedMedia') === -1
  ? mongoose.model('BannedMedia', {
      format: Number,
      cid: String,
      reason: String,
      time: { type: Date, default: Date.now },
      moderator: { type: Number, ref: 'User' }
    })
  : mongoose.model('BannedMedia')

export default class SongBan extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Bans songs from being played ever again.'

    this.BannedMedia = BannedMedia

    this.onAdvance = this.onAdvance.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance(booth, { media }) {
    BannedMedia.findOne({ cid: media.cid, format: media.format }).exec()
      .then(banned => {
        const modSkip = this.sekshi.getModule('modskip')
        if (banned && modSkip) {
          modSkip.skip(this.sekshi.getSelf(), banned.reason || 'This song was blacklisted.')
        }
      })
  }

  @command('songban', 'bansong', { role: command.ROLE.BOUNCER })
  songban(user, ...reason) {
    reason = reason.join(' ')
    const media = this.sekshi.getCurrentMedia()
    BannedMedia.create({
      format: media.format,
      cid: media.cid,
      reason: reason,
      moderator: user.id
    })
      .then(banned => {
        this.sekshi.sendChat(`@${user.username} This song has now been blacklisted.`)
      })
  }

  @command('songunban', 'unbansog', { role: command.ROLE.BOUNCER })
  songunban(user, cid) {
    BannedMedia.findOne({ cid: cid }).exec()
      .then(banned => {
        if (banned) BannedMedia.remove({ _id: banned._id })
      })
  }

  @command('banskip', 'bs', { role: command.ROLE.BOUNCER })
  banskip(user, ...reason) {
    const modSkip = this.sekshi.getModule('modskip')
    if (modSkip) modSkip.skip(user, ...reason)
    setTimeout(() => { this.songban(user, ...reason) }, 300)
  }
}
