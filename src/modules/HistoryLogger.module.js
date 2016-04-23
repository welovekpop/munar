import { Module } from '../'
import Media from '../models/Media'
import HistoryEntry from '../models/HistoryEntry'
import Grab from '../models/Grab'
import Vote from '../models/Vote'
import { fixTags } from '../utils'
import moment from 'moment'

const debug = require('debug')('sekshi:history-logging')

export default class HistoryLogger extends Module {
  author = 'ReAnna'
  description = 'Keeps a history of all songs that are played in the room.'

  init () {
    this.bot.on(this.bot.ADVANCE, this.onAdvance)
    this.bot.on(this.bot.VOTE, this.onVote)
    this.bot.on(this.bot.GRAB_UPDATE, this.onGrab)

    this._currentEntry = null
  }
  destroy () {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  getCurrentEntry () {
    return this._currentEntry
  }

  onAdvance = (booth, newPlay, previous) => {
    const bot = this.bot

    this._grabs = []

    if (this._currentEntry && previous && previous.score) {
      previous.score.listeners = bot.getUsers().length
      this._currentEntry.set('score', previous.score).save()
    }

    let currentMedia = bot.getCurrentMedia()
    let dj = bot.getCurrentDJ()
    if (!currentMedia || !currentMedia.cid) {
      return
    }

    // just to be sure?
    if (!dj) {
      dj = { id: null }
    }

    let media = Media.findOne({ format: currentMedia.format, cid: currentMedia.cid }).exec()
      .then((media) => {
        if (media) return media
        // first time this is played!
        let fixed = fixTags(currentMedia)
        let model = new Media({
          format: currentMedia.format,
          cid: currentMedia.cid,
          author: fixed.author,
          title: fixed.title,
          image: currentMedia.image,
          duration: currentMedia.duration
        })
        return model.save()
      })

    const startTime = moment.utc(newPlay.startTime, 'YYYY-MM-DD HH:mm:ss')
    let historyEntry = new HistoryEntry({
      _id: newPlay.historyID,
      dj: dj.id,
      media: null,
      time: +startTime,
      // heh
      score: { positive: 0, negative: 0, grabs: 0, listeners: 0 }
    })
    this._currentEntry = historyEntry

    media
      .then((media) => {
        debug('dj', dj.id)
        debug('media', `${media.fullTitle} (${media.id})`)
        debug('time', startTime.format())
        return historyEntry.set('media', media.id).save()
      })
      .catch((e) => {
        console.error(e.stack)
      })
  }

  onVote = ({ id, direction }) => {
    debug('vote', id, direction)
    if (this._currentEntry) {
      Vote.update(
        { user: id, history: this._currentEntry.id },
        { direction: direction, time: Date.now() },
        { upsert: true }
      )
        .then((vote) => { debug('saved vote', id, direction) })
        .catch((err) => { debug('vote-err', err) })
    }
  }

  onGrab = (uid) => {
    debug('grab', uid)
    if (this._currentEntry && this._grabs.indexOf(uid) === -1) {
      this._grabs.push(uid)
      new Grab({
        history: this._currentEntry.id,
        user: uid
      }).save()
        .then((grab) => { debug('saved grab', uid) })
        .catch((err) => { debug('grab-err', err) })
    }
  }
}
