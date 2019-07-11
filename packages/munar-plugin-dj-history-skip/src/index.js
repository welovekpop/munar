import { Plugin, command, permissions } from 'munar-core'
import lockskip from 'munar-helper-booth-lockskip'
import delay from 'delay'
import moment from 'moment'
import isSameSong from './isSameSong'

const supportsHistory = (adapter) =>
  typeof adapter.getDJHistory === 'function'

const stringId = (user) => {
  const { adapter, sourceId } = user.compoundId()
  return `${adapter}:${sourceId}`
}
class Exemptions extends Set {
  add (user) {
    return super.add(stringId(user))
  }
  check (user) {
    if (this.has(user)) {
      this.delete(user)
      return true
    }
    return false
  }
  has (user) {
    return super.has(stringId(user))
  }
  delete (user) {
    return super.delete(stringId(user))
  }
}

export default class DJHistorySkip extends Plugin {
  static defaultOptions = {
    limit: 50,
    lockskipPosition: 1
  }

  exemptions = new Exemptions()
  lastSkip = Promise.resolve()

  enable () {
    this.bot.on('djBooth:advance', this.onAdvance)
  }

  disable () {
    this.bot.removeListener('djBooth:advance', this.onAdvance)
  }

  @command('exempt', {
    role: permissions.MODERATOR,
    description: 'Exempt a user from history skip for one turn.',
    arguments: [ command.arg.user() ]
  })
  exempt (message, targetName) {
    const target = message.source.getUserByName(targetName)
    if (target) {
      this.exemptions.add(target)
      message.reply(`${target.username} will be exempted from history skip on their next turn.`)
    }
  }

  onAdvance = (adapter) => {
    const next = adapter.getDJBooth().getEntry()
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

  isHistoryMatch (a, b) {
    return isSameSong(a.media, b.media) && a.id !== b.id
  }

  async maybeSkip (adapter, current) {
    const history = await adapter.getDJHistory().getRecent(this.options.limit)
    const dj = await adapter.getDJBooth().getDJ()
    if (this.exemptions.check(dj)) {
      return
    }

    const lastPlay = history.find((entry) => this.isHistoryMatch(entry, current))
    if (lastPlay) {
      const duration = moment.duration(Date.now() - lastPlay.playedAt, 'milliseconds')
      adapter.send(
        `@${dj.username} This song was played ${duration.humanize()} ago` +
        (lastPlay.user ? ` by ${lastPlay.user.username}` : '') +
        '.'
      )
      await delay(500)
      await lockskip(adapter, { position: this.options.position })
    }
  }
}
