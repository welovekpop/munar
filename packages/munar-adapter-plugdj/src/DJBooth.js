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

    this.mp.on('advance', (next, previous) => {
      plug.receive('djBooth:advance', {
        previous: previous ? convertMedia(previous.media) : null,
        next: this.getMedia()
      })
    })
  }

  get mp () {
    return this.plug.mp
  }

  getEntry () {
    const entry = this.mp.historyEntry()
    if (!entry) {
      return null
    }

    return {
      id: entry.id,
      media: this.getMedia(),
      user: this.getDJ(),
      playedAt: entry.timestamp
    }
  }

  getMedia () {
    const media = this.mp.media()
    if (!media) {
      return null
    }
    return convertMedia(media)
  }

  getDJ () {
    const dj = this.mp.dj()
    return dj ? this.plug.getUser(dj.id) : null
  }

  skip () {
    const entry = this.mp.historyEntry()
    if (!entry) {
      return
    }
    return entry.skip()
  }

  async lockskip ({ position }) {
    const { id } = this.mp.dj()
    const entry = this.mp.historyEntry()
    if (this.mp.isCycling()) {
      await entry.skip()
      await this.mp.moveDJ(id, position)
    } else {
      const locked = this.mp.isLocked()
      try {
        await this.mp.setLock(true)
        await entry.skip()
        await this.mp.addDJ(id)
        await this.mp.moveDJ(id, position)
      } finally {
        await this.mp.setLock(locked)
      }
    }
  }
}
