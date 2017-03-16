import { normalizeMedia } from './DJBooth'
import mergeIncludedModels from './mergeIncludedModels'

export default class DJHistory {
  constructor (uw) {
    this.uw = uw
  }

  async getRecent (limit) {
    const booth = this.uw.getDJBooth()
    // Skip the first entry if a song is currently being played, because that
    // entry will be the current song.
    const start = booth.getMedia() !== null ? 1 : 0

    const query = {
      page: {
        offset: start,
        limit: limit
      }
    }
    const { body } = await this.uw.request('get', 'booth/history', query)
    return mergeIncludedModels(body).map((entry) => ({
      id: entry._id,
      media: normalizeMedia(entry.media),
      user: this.uw.toBotUser(entry.user),
      playedAt: new Date(entry.playedAt)
    }))
  }
}
