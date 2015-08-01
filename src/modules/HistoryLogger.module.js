const debug = require('debug')('sekshi:history-logging')
const { User, Media, HistoryEntry, Vote, Grab } = require('../models')
const SekshiModule = require('../Module')
const { fixTags } = require('../utils')
const moment = require('moment')

export default class HistoryLogger extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Keeps a history of all songs that are played in the room.'

    this.onAdvance = this.onAdvance.bind(this)
    this.onVote = this.onVote.bind(this)
    this.onGrab = this.onGrab.bind(this)
  }

  init() {
    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
    this.sekshi.on(this.sekshi.VOTE, this.onVote)
    this.sekshi.on(this.sekshi.GRAB_UPDATE, this.onGrab)

    this._currentEntry = null
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  getCurrentEntry() {
    return this._currentEntry
  }

  onAdvance({}, newPlay, previous) {
    const sekshi = this.sekshi

    this._grabs = []

    if (this._currentEntry && previous && previous.score) {
      previous.score.listeners = sekshi.getUsers().length
      this._currentEntry.set('score', previous.score).save()
    }

    let currentMedia = sekshi.getCurrentMedia()
    let dj = sekshi.getCurrentDJ()
    if (!currentMedia || !currentMedia.cid) return

    // just to be sure?
    if (!dj) dj = { id: null }

    let media = Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec()
      .then(media => {
        if (media) return media
        // first time this is played!
        let fixed = fixTags(currentMedia)
        let model = new Media({
          format: currentMedia.format
        , cid: currentMedia.cid
        , author: fixed.author
        , title: fixed.title
        , image: currentMedia.image
        , duration: currentMedia.duration
        })
        return model.save()
      })

    const startTime = moment.utc(newPlay.startTime, 'YYYY-MM-DD HH:mm:ss')
    let historyEntry = new HistoryEntry({
      _id: newPlay.historyID
    , dj: dj.id
    , media: null
    , time: +startTime
      // heh
    , score: { positive: 0, negative: 0, grabs: 0, listeners: 0 }
    })
    this._currentEntry = historyEntry;

    media
      .then(media => {
        debug('dj', dj.id)
        debug('media', `${media.fullTitle} (${media.id})`)
        debug('time', startTime.format())
        return historyEntry.set('media', media.id).save()
      })
      .catch(e => { console.error(e.stack) })
  }

  onVote({ id, direction }) {
    debug('vote', id, direction)
    if (this._currentEntry) {
      Vote.update(
        { user: id, history: this._currentEntry.id },
        { direction: direction, time: Date.now() },
        { upsert: true }
      )
        .then(vote => { debug('saved vote', id, direction) })
        .catch(err => { debug('vote-err', err) })
    }
  }

  onGrab(uid) {
    debug('grab', uid)
    if (this._currentEntry && this._grabs.indexOf(uid) === -1) {
      this._grabs.push(uid);
      new Grab({
        history: this._currentEntry.id,
        user: uid
      }).save()
        .then(grab => { debug('saved grab', uid) })
        .catch(err => { debug('grab-err', err) })
    }
  }
}
