export function normalizeMedia (media) {
  // Rename the `artist` property to `author` for consistency with other
  // adapters with DJ Booth support.
  const result = {
    ...media.media,
    ...media,
    author: media.artist
  }
  delete result.artist
  return result
}

export default class DJBooth {
  booth = null

  constructor (uw) {
    this.uw = uw

    uw.socketEvents.on('advance', (booth) => {
      const previous = this.getMedia()

      this.booth = booth

      uw.receive('djBooth:advance', {
        previous,
        next: this.getMedia()
      })
    })
  }

  getEntry () {
    if (!this.booth) {
      return null
    }

    return {
      id: this.booth.historyID,
      media: this.getMedia(),
      user: this.getDJ(),
      playedAt: new Date(this.booth.playedAt)
    }
  }

  getMedia () {
    if (!this.booth) {
      return null
    }
    return normalizeMedia(this.booth.media)
  }

  getDJ () {
    if (!this.booth) {
      return null
    }
    return this.uw.getUser(this.booth.userID)
  }

  async skip () {
    if (!this.booth) {
      return
    }
    await this.uw.request('post', 'booth/skip', {
      userID: this.booth.userID,
      reason: ''
    })
  }
}
