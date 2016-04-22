import { Module, command } from '../'
import Media from '../models/Media'
import HistoryEntry from '../models/HistoryEntry'
import assign from 'object-assign'
import moment from 'moment'
import * as utils from '../utils'

const debug = require('debug')('sekshi:check-plays')

export default class MediaStats extends Module {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Provides staff with some statistics on media plays.'
  }

  // public API
  getRecentPlays(media, span = 'w') {
    const query = typeof media === 'string'
      ? { cid: media }
      : { cid: media.cid }

    const since = utils.spanToTime(span)
    const hours = moment().diff(since, 'hours')
    const currentStart = moment.utc(this.sekshi.getStartTime(), 'YYYY-MM-DD HH:mm:ss')
    return Media.findOne(query).exec().then(
      media => HistoryEntry.find({ media: media.id })
                           .where('time').gte(since.toDate()).lt(currentStart.toDate())
                           .sort('+time')
                           .populate('dj')
                           .exec()
    )
  }

  getMostPlayed(amount = 3, time = 'f') {
    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'
    // find most played songs
    return HistoryEntry.aggregate()
      .match({ time: { $gte: since.toDate() } })
      .group({ _id: '$media', count: { $sum: 1 } })
      .sort('-count _id')
      .project('_id count')
      .limit(amount)
      .exec()
      .then(mostPlayed => {
        // find media documents for the most played songs
        const mediaIds = mostPlayed.map(hist => hist._id)
        const playcounts = {}
        mostPlayed.forEach(h => { playcounts[h._id] = h.count })
        return Media.where('_id').in(mediaIds).lean().exec()
          .map(m => assign(m, { plays: playcounts[m._id] }))
          .then(medias => medias.sort((a, b) => a.plays > b.plays ? -1 : 1)) // good enough!
      })
  }

  getLastPlay(media) {
    const query = typeof media === 'string'
      ? { cid: media }
      : { cid: media.cid }

    const currentStart = moment.utc(this.sekshi.getStartTime(), 'YYYY-MM-DD HH:mm:ss')
    return Media.findOne(query).lean().exec().then(
      media => HistoryEntry.findOne({ media: media._id })
                           .where('time').lt(currentStart.toDate())
                           .sort('-time')
                           .populate('dj')
                           .exec()
    )
  }

  // chat commands
  @command('lastplayed')
  lastplayed (message) {
    const currentMedia = this.sekshi.getCurrentMedia()
    if (!currentMedia) return
    this.getLastPlay(currentMedia)
      .then(mostRecent => {
        if (mostRecent) {
          let text = `This song was played ${moment(mostRecent.time).fromNow()}`
          if (mostRecent.dj) text += ` by ${mostRecent.dj.username}`
          message.reply(`${text}.`)
        }
        else {
          message.reply(`This song hasn't been played before.`)
        }
      })
      .catch(e => { console.error(e) })
  }

  @command('playcount')
  playcount(user, span = 'w') {
    const hours = moment().diff(utils.spanToTime(span), 'hours')
    const allTime = span === 'f'
    const currentMedia = this.sekshi.getCurrentMedia()
    if (!currentMedia) return
    this.getRecentPlays(currentMedia, span)
      .then(results => {
        const playcount = results.length

        if (playcount > 0) {
          const mostRecent = results[results.length - 1]

          let text = `@${user.username} This song was played ${utils.times(playcount)}`
          if (!allTime) text += ` over the past ${utils.days(hours)}`
          text += `, most recently ${moment(mostRecent.time).utc().fromNow()}`
          if (mostRecent.dj) text += ` by ${mostRecent.dj.username}`

          this.sekshi.sendChat(`${text}.`)
        }
        else {
          this.sekshi.sendChat(`@${user.username} This song hasn't been played ` +
                               (allTime ? `before.` : `in the last ${utils.days(hours)}.`))
        }
      })
      .catch(e => { console.error(e) })
  }

  @command('mostplayed', { role: command.ROLE.RESIDENTDJ })
  mostplayed(message, amount = 3, time = 'f') {
    // !mostplayed can take 1, 2, or no parameters.
    // without parameters, it shows the top 3 most played songs
    // ever. With one parameter, it shows the top N most played
    // songs ever, *except* if the parameter is a letter (d, w, m, f),
    // in which case it shows the top 3 most played songs over the
    // given time span. With two parameters, it shows the top N
    // most played songs over the given time span.
    //   !mostplayed
    //   !mostplayed 5
    //   !mostplayed w
    //   !mostplayed 5 d
    if (typeof amount === 'string' && /^\d+$/.test(amount)) {
      amount = parseInt(amount, 10)
    }
    // !mostplayed (d|w|m|f)
    if (typeof amount === 'string') {
      time = amount
      amount = 3
    }

    const since = utils.spanToTime(time)
    const hours = moment().diff(since, 'hours')
    const allTime = time === 'f'
    // find most played songs
    let response = 'Most played songs'
    if (!allTime) response += ` over the last ${utils.days(hours)}`
    response += ':\n'
    return this.getMostPlayed(amount, time)
      .then(mostPlayed => {
        response += mostPlayed.map((m, i) => `#${i + 1} - ${m.author} - ${m.title} (${m.plays} plays)`).join('\n')
        message.reply(response)
      })
  }

  @command('tagged', { role: command.ROLE.RESIDENTDJ })
  tagged(user, cid) {
    if (!cid) {
      let media = this.sekshi.getCurrentMedia()
      if (!media) return
      cid = media.cid
    }
    Media.findOne({ cid: cid }).exec()
      .then(model => {
        this.sekshi.sendChat(`@${user.username} "${model.author}" - "${model.title}"`)
      })
  }

  @command('retag', { role: command.ROLE.RESIDENTDJ, ninjaVanish: true })
  retag(user, cid, ...newTag) {
    let author
    let title
    Media.findOne({ cid: cid }).lean().exec()
      .then(media => {
        if (!media) {
          media = this.sekshi.getCurrentMedia()
          newTag.unshift(cid)
        }
        if (!media) return

        newTag = newTag.join(' ')

        if (newTag.length === 0) {
           let fixed = utils.fixTags(media)
           author = fixed.author
           title = fixed.title
        }
        else {
          let split = newTag.indexOf(' - ')
          author = newTag.slice(0, split)
          title = newTag.slice(split + 3)
        }

        if (!author) {
          return this.sekshi.sendChat(`@${user.username} Please provide a valid artist name.`)
        }
        if (!title) {
          return this.sekshi.sendChat(`@${user.username} Please provide a valid song title.`)
        }

        return Media.update({ cid: media.cid }, { $set: { author, title } }).exec()
      })
      .then(() => {
        this.sekshi.sendChat(`@${user.username} Song retagged to "${author}" - "${title}"!`, 5000)
      })
      .catch(e => console.error(e))
  }
}
