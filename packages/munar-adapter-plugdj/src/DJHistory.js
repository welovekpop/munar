import { convertMedia } from './DJBooth'

export default class DJHistory {
  constructor (plug) {
    this.plug = plug
  }

  get mp () {
    return this.plug.mp
  }

  convertUser (raw) {
    const user = this.mp.user(raw.id)
    if (user) {
      return this.plug.toBotUser(user)
    }
    return this.plug.toBotUser(raw)
  }

  async getRecent (limit) {
    const history = await this.mp.getRoomHistory()
    return history.slice(0, limit).map((entry) => ({
      id: entry.id,
      media: convertMedia(entry.media),
      user: this.convertUser(entry.user),
      playedAt: entry.timestamp
    }))
  }
}
