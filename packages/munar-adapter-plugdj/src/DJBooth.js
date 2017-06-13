import { EventEmitter } from 'events'
import pify from 'pify'

export const convertMedia = (media) => ({
  sourceType: media.format === 1 ? 'youtube' : 'soundcloud',
  sourceID: media.cid,
  author: media.author,
  title: media.title,
  duration: media.duration
})

export default class DJBooth extends EventEmitter {
  constructor (plug) {
    super()
    this.plug = plug

    this.plugged.on(this.plugged.ADVANCE, (booth, playback, previous) => {
      plug.receive('djBooth:advance', {
        previous: previous ? convertMedia(previous.media) : null,
        next: this.getMedia()
      })
    })
  }

  get plugged () {
    return this.plug.plugged
  }

  getEntry () {
    const entry = this.plugged.getPlayback()
    if (!entry) {
      return null
    }

    return {
      id: entry.historyID,
      media: this.getMedia(),
      user: this.getDJ(),
      playedAt: new Date(entry.startTime)
    }
  }

  getMedia () {
    const media = this.plugged.getMedia()
    if (!media) {
      return null
    }
    return convertMedia(media)
  }

  getDJ () {
    const dj = this.plugged.getDJ()
    return dj ? this.plug.getUser(dj.id) : null
  }

  skip () {
    if (!this.plugged.getMedia()) {
      return
    }
    const skip = pify(this.plugged.skipDJ).bind(this.plugged)
    return skip()
  }
}
