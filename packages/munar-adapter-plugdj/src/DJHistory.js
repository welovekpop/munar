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

  convertUser (raw) {
    const user = this.plugged.getUserByID(raw.id)
    if (user) {
      return this.plug.toBotUser(user)
    }
    return this.plug.toBotUser(raw)
  }

  async getRecent (limit) {
    const history = await this.getRoomHistory()
    return history.slice(0, limit).map((entry) => ({
      id: entry.id,
      media: convertMedia(entry.media),
      user: this.convertUser(entry.user),
      playedAt: new Date(entry.timestamp)
    }))
  }
}
