const debug = require('debug')('sekshi:history-logging')
const { User, Media, HistoryEntry } = require('../models')
const Promise = require('promise')
const SekshiModule = require('../Module')
const moment = require('moment')

export default class HistoryLogger extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '0.3.1'
    this.description = 'Keeps a history of all songs that are played in the room.'

    this.onAdvance = this.onAdvance.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance({}, newPlay, previous) {
    const sekshi = this.sekshi

    if (previous && previous.historyID && previous.score) {
      previous.score.listeners = sekshi.getUsers().length

      HistoryEntry.update({ _id: previous.historyID },
                          { $set: { score: previous.score } }).exec()
    }

    let currentMedia = sekshi.getCurrentMedia()
    let dj = sekshi.getCurrentDJ()
    if (!currentMedia) return

    // just to be sure?
    if (!dj) dj = { id: null }

    let media = Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec()
      .then(media => media || Media.create({
        format: currentMedia.format
      , cid: currentMedia.cid
      , author: currentMedia.author
      , title: currentMedia.title
      , image: currentMedia.image
      , duration: currentMedia.duration
      }))

    media.then(media => {
      const startTime = moment.utc(newPlay.startTime, 'YYYY-MM-DD HH:mm:ss')
      debug('media', `${media.fullTitle} (${media.id})`)
      debug('time', startTime.format())
      HistoryEntry.create({
        _id: newPlay.historyID,
        dj: dj.id,
        media: media.id,
        time: +startTime,
        // heh
        score: { positive: 0, negative: 0, grabs: 0, listeners: 0 }
      })
    })
    .then(null, e => {
      debug('err', e)
    })
  }
}