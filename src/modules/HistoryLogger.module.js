const debug = require('debug')('sekshi:history-logging')
const assign = require('object-assign')
const { User, Media, HistoryEntry } = require('../models')
const Promise = require('promise')
const SekshiModule = require('../Module')

export default class HistoryLogger extends SekshiModule {

  constructor(sekshi, options) {
    this.name = 'History Logger'
    this.author = 'ReAnna'
    this.version = '0.3.0'
    this.description = 'Keeps a history of all songs that are played in the room.'

    super(sekshi, options)

    // sigh…
    this.onAdvance = this.onAdvance.bind(this)
    sekshi.on(sekshi.ADVANCE, this.onAdvance)
  }

  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance({}, newPlay, previous) {
    const sekshi = this.sekshi

    if (previous && previous.historyID && previous.score) {
      HistoryEntry.update({ _id: previous.historyID },
                          { $set: { score: previous.score } }).exec()
    }

    let currentMedia = sekshi.getCurrentMedia()
    let dj = sekshi.getCurrentDJ()
    if (!currentMedia || !dj) return

    let media = Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec()
      .then(media => media || Media.create({
        format: currentMedia.format
      , cid: currentMedia.cid
      , author: currentMedia.author
      , title: currentMedia.title
      , image: currentMedia.image
      , duration: currentMedia.duration
      }))
    let user = User.findById(dj.id).exec()

    Promise.all([ media, user ])
      .then(([ media, user ]) => {
        debug('dj', `${user.username} (${user.id})`)
        debug('media', `${media.fullTitle} (${media.id})`)
        debug('time', newPlay.startTime)
        HistoryEntry.create({
          _id: newPlay.historyID
        , dj: user.id
        , media: media.id
        , time: new Date(newPlay.startTime)
          // heh
        , score: { positive: 0, negative: 0, grabs: 0, listeners: 0 }
        })
      })
      .catch(e => {
        debug('err', e)
      })
  }
}