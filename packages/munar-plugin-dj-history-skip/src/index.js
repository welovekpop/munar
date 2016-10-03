import { Plugin } from 'munar-core'
import delay from 'delay'

const supportsHistory = (adapter) =>
  typeof adapter.getDJHistory === 'function'
const supportsBoothSkipping = (adapter) =>
  typeof adapter.getDJBooth === 'function' &&
  typeof adapter.getDJBooth().skip === 'function'
const supportsBoothLockskipping = (adapter) =>
  typeof adapter.getDJBooth === 'function' &&
  typeof adapter.getDJBooth().lockskip === 'function'

export default class DJHistorySkip extends Plugin {
  static defaultOptions = {
    limit: 50,
    lockskipPosition: 1
  }

  lastSkip = Promise.resolve()

  enable () {
    this.bot.on('djBooth:advance', this.onAdvance)
  }

  disable () {
    this.bot.removeListener('djBooth:advance', this.onAdvance)
  }

  onAdvance = (adapter, { next }) => {
    if (supportsHistory(adapter) && next) {
      // Ensure that we only skip the next song once the previous lockskip has
      // completed.
      const doSkip = () => this.maybeSkip(adapter, next)
      this.lastSkip = this.lastSkip
        .then(doSkip, doSkip)
        .catch((err) => {
          console.error(err.stack)
        })
    }
  }

  isSameSong (a, b) {
    // TODO abstract into a Media interface with an `isSameSong`-like method?
    if (a.sourceType !== b.sourceType || a.sourceID !== b.sourceID) {
      return false
    }
    // üWave medias have a start and end property, so an object with the same
    // sourceType and sourceID can still contain different songs. We'll assume
    // (quite arbitrarily) that anything that has a 2/3rds overlap in start/end
    // times is the same song.
    if ('start' in a && 'end' in a && 'start' in b && 'end' in b) {
      const duration = a.end - a.start
      const overlap = Math.abs(a.end - b.start) / duration
      if (overlap < 2 / 3) {
        return false
      }
    }
    return true
  }

  async lockskip (adapter, position = 1) {
    const booth = adapter.getDJBooth()
    const waitlist = adapter.getWaitlist()
    const dj = await booth.getDJ()

    if (supportsBoothLockskipping(adapter)) {
      await booth.lockskip({ position })
    } else {
      // Attempt to lockskip manually.
      await booth.skip()
      const newDJ = await booth.getDJ()
      if (dj.id !== newDJ) {
        await waitlist.move(dj.id, position)
      }
    }
  }

  async maybeSkip (adapter, media) {
    const history = await adapter.getDJHistory().getRecent(this.options.limit)
    const lastPlay = history.find((entry) => this.isSameSong(entry.media, media))
    if (lastPlay) {
      const { username } = await adapter.getDJBooth().getDJ()
      adapter.send(`@${username} This song is in the history.`)
      if (supportsBoothSkipping(adapter)) {
        await delay(500)
        await this.lockskip(adapter, this.options.position)
      }
    }
  }
}
