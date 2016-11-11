import { EventEmitter } from 'events'

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
}
