const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:check-plays')
const assign = require('object-assign')
const { Media, HistoryEntry } = require('../models')
const moment = require('moment')

const SPANS = {
  d: 24,
  w: 24 * 7,
  m: 24 * 30
}

function times(x) {
  return x === 1 ? 'once'
       : x === 2 ? 'twice'
       : x >=  3 ? `${x} times`
       : ''
}

function days(h) {
  if (h < 24 || (h < 48 && h % 24 !== 0)) {
    return h === 1 ? 'hour' : `${h} hours`
  }
  const x = Math.floor(h / 24)
  return x === 1 ? 'day' : `${x} days`
}

export default class CheckPlays extends SekshiModule {

  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '0.2.0'
    this.description = 'Provides staff with some statistics on media plays.'

    super(sekshi, options)

    this.permissions = {
      lastplayed: sekshi.USERROLE.RESIDENTDJ,
      playcount: sekshi.USERROLE.RESIDENTDJ,
      mostplayed: sekshi.USERROLE.RESIDENTDJ
    }
  }

  lastplayed() {
    const currentMedia = this.sekshi.getCurrentMedia()
    if (!currentMedia) return
    const currentStart = moment.utc(this.sekshi.getStartTime(), 'YYYY-MM-DD HH:mm:ss')
    Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec().then(
      media => HistoryEntry.findOne({ media: media.id })
                           .where('time').lt(+currentStart)
                           .sort('-time')
                           .populate('dj')
                           .exec()
    ).then(
      mostRecent => {
        if (mostRecent) {
          this.sekshi.sendChat(`This song was played ${moment(mostRecent.time).fromNow()}` +
                               (mostRecent.dj ? ` by ${mostRecent.dj.username}.` : '.'))
        }
        else {
          this.sekshi.sendChat(`This song hasn't been played before.`)
        }
      },
      e => { debug('media-err', e) }
    )
  }

  playcount(user, span = 'w') {
    const hours = span in SPANS ? SPANS[span] : span
    const since = moment().subtract(hours, 'hours')
    const currentMedia = this.sekshi.getCurrentMedia()
    if (!currentMedia) return
    const currentStart = moment.utc(this.sekshi.getStartTime(), 'YYYY-MM-DD HH:mm:ss')

    Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec().then(
      media => HistoryEntry.find({ media: media.id })
                           .where('time').gt(+since).lt(+currentStart)
                           .sort('+time')
                           .populate('dj')
                           .exec()
    ).then(
      results => {
        const playcount = results.length

        if (playcount > 0) {
          const mostRecent = results[results.length - 1]
          const djText = mostRecent.dj ? ` by ${mostRecent.dj.username}` : ''
          this.sekshi.sendChat(`This song was played ${times(playcount)} over the last ${days(hours)}, ` +
                               `most recently ${moment(mostRecent.time).utc().fromNow()}${djText}.`)
        }
        else {
          this.sekshi.sendChat(`This song hasn't been played in the last ${days(hours)}.`)
        }
      }
    )
    .then(null, e => { debug('media-err', e) })
  }

  mostplayed(user, amount = 3) {
    if (typeof amount === 'string' && /^\d+$/.test(amount)) {
      amount = parseInt(amount, 10)
    }
    // find most played songs
    HistoryEntry.aggregate()
      .group({ _id: '$media', count: { $sum: 1 } })
      .sort({ count: -1 })
      .project('_id count')
      .limit(amount)
      .exec()
      .then(mostPlayed => {
        // find media documents for the most played songs
        const mediaIds = mostPlayed.map(hist => hist._id)
        const playcounts = {}
        mostPlayed.forEach(h => { playcounts[h._id] = h.count })

        this.sekshi.sendChat(`@${user.username} Most played songs:`)
        return Media.where('_id').in(mediaIds).select('_id author title').lean().exec()
          .then(medias => {
            medias.map(m => assign(m, { plays: playcounts[m._id] }))
              .sort((a, b) => a.plays > b.plays ? -1 : 1) // good enough!
              .forEach((m, i) => {
                this.sekshi.sendChat(`#${i + 1} - ${m.author} - ${m.title} (${m.plays} plays)`)
              })
          })
      })
      .then(null, e => console.error(e))
  }
}