import promisify from 'pify'
import { convertMedia } from './DJBooth'

export default class DJHistory {
  constructor (plug) {
    this.plug = plug

    this.getRoomHistory = promisify(this.plugged.getRoomHistory.bind(this.plugged))
  }

  get plugged () {
    return this.plug.plugged
  }

  async getRecent (limit) {
    const history = await this.getRoomHistory()
    return history.slice(0, limit).map((entry) => ({
      media: convertMedia(entry.media),
      playedAt: new Date(entry.timestamp)
    }))
  }
}
