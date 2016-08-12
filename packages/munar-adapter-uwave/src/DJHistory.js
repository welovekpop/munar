import { normalizeMedia } from './DJBooth'

export default class DJHistory {
  constructor (uw) {
    this.uw = uw
  }

  async getRecent (limit) {
    const booth = this.uw.getDJBooth()
    // Skip the first entry if a song is currently being played, because that
    // entry will be the current song.
    const start = booth.getMedia() !== null ? 1 : 0

    const { body } = await this.uw.request('get', `booth/history?limit=${limit + start}`)
    return body.result.slice(start).map((entry) => ({
      media: normalizeMedia(entry.media),
      playedAt: new Date(entry.playedAt)
    }))
  }
}
