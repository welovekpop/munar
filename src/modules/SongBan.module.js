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
    this.version = '1.0.0'
    this.description = 'Bans songs from being played ever again.'

    this.permissions = {
      songban: sekshi.USERROLE.BOUNCER,
      banskip: sekshi.USERROLE.BOUNCER,
      songunban: sekshi.USERROLE.BOUNCER
    }

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
    BannedMedia.findOne({ cid: media.cid, format: media.format }).exec().then(banned => {
      if (banned) {
        this.sekshi.onMessage({
          id: 'sekshi',
          message: banned.reason
            ? `!skip "${banned.reason}"`
            : `!skip "This song was blacklisted."`
        })
      }
    })
  }

  songban(user, reason = '') {
    const media = this.sekshi.getCurrentMedia()
    BannedMedia.create({
      format: media.format,
      cid: media.cid,
      reason: reason,
      moderator: user.id
    }).then(banned => {
      this.sekshi.sendChat(`@${user.username} This song has now been blacklisted.`)
    })
  }

  songunban(user, cid) {
    BannedMedia.findOne({ cid: cid }).exec().then(banned => {
      if (banned) BannedMedia.remove({ _id: banned._id })
    })
  }

  banskip(user, reason = '') {
    this.sekshi.onMessage({ id: 'sekshi', message: `!skip "${reason}"` })
    setTimeout(() => { this.songban(user, reason) }, 300)
  }
}