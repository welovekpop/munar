const SekshiModule = require('../Module')
const command = require('../command')
const debug = require('debug')('sekshi:mod-tools')

export default class ModTools extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Provides moderation commands on the bot so you don\'t have to deal with plug\'s moderator UI.'
  }

  defaultOptions() {
    return {
      eatshitDelay: 20
    }
  }

  @command('clearwaitlist', { role: command.ROLE.MANAGER })
  clearwaitlist(user) {
    this.sekshi.setLock(true, true, e => {
      if (e) debug('lock-err', e)
      else this.sekshi.setLock(false, false, e => {
        if (e) debug('unlock-err', e)
      })
    })
  }

  @command('move', { role: command.ROLE.BOUNCER })
  move(user, target, pos) {
    debug('move', target, pos)
    if (!/^\d+$/.test(pos)) {
      return this.sekshi.sendChat(`@${user.username} Invalid position!`)
    }
    pos = parseInt(pos, 10) - 1
    let targetUser = this.sekshi.getUserByName(target)
    if (targetUser) {
      if (this.sekshi.getWaitlist().indexOf(targetUser.id) === -1) {
        this.sekshi.addToWaitlist(targetUser.id, e => {
          if (e) debug('add-wl-err', e)
          else this.sekshi.moveDJ(targetUser.id, pos, e => {
            if (e) debug('move-err', e)
          })
        })
      }
      else {
        this.sekshi.moveDJ(targetUser.id, pos, e => {
          if (e) debug('move-err', e)
        })
      }
    }
    else {
      this.sekshi.sendChat(`@${user.username} I don't know "${target}"!`)
    }
  }

  @command('ban', { role: command.ROLE.BOUNCER })
  ban(user, targetName, duration = 'h') {
    if (duration !== 'h' && duration !== 'd' && duration !== 'f') {
      duration = 'h'
    }
    this.sekshi.findUser(targetName).then(target => {
      this.sekshi.banUser(target.id, duration, e => {
        if (e) debug('ban-err', e)
      })
    })
  }

  @command('unban', { role: command.ROLE.BOUNCER })
  unban(user, targetName) {
    this.sekshi.findUser(targetName).then(target => {
      this.sekshi.unbanUser(target.id, e => {
        if (e) debug('ban-err', e)
        else {
          this.sekshi.sendChat(`@${user.username} Unbanned ${target.username}`)
        }
      })
    })
  }

  @command('kick', { role: command.ROLE.BOUNCER })
  kick(user, targetName) {
    this.sekshi.findUser(targetName).then(target => {
      this.sekshi.banUser(target.id, 'h', e => {
        if (e) return debug('kick-err', e)
        this.sekshi.unbanUser(target.id, e=> {
          if (e) debug('kick-err', e)
        })
      })
    })
  }

  @command('mute', { role: command.ROLE.BOUNCER })
  mute(user, targetName, duration = 15) {
    duration = duration === 45 || duration === 'l' ? 'l'
             : duration === 30 || duration === 'm' ? 'm'
             : 's'

    this.sekshi.findUser(targetName).then(target => {
      this.sekshi.muteUser(target.id, duration, 1, e => {
        if (e) debug('mute-err', e)
      })
    })
  }

  @command('unmute', { role: command.ROLE.BOUNCER })
  unmute(user, targetName) {
    this.sekshi.findUser(targetName).then(target => {
      this.sekshi.unmuteUser(target.id, e => {
        if (e) debug('unmute-err', e)
      })
    })
  }

  @command('lock', { role: command.ROLE.MANAGER })
  lock(user, clear = false) {
    debug('locking waitlist', clear === 'clear' ? 'clearing' : 'not clearing')
    this.sekshi.setLock(true, clear === 'clear', e => {
      if (e) debug('lock-err', e)
    })
  }

  @command('unlock', { role: command.ROLE.MANAGER })
  unlock(user) {
    debug('unlocking waitlist')
    this.sekshi.setLock(false, false, e => {
      if (e) debug('unlock-err', e)
    })
  }

  @command('cycle', { role: command.ROLE.MANAGER })
  cycle(user, set = 'toggle') {
    let oldCycle = this.sekshi.doesWaitlistCycle()
    let newCycle = set === 'toggle'
      ? !oldCycle
      : set !== 'off' // anything that isn't "off" _enables_ dj cycle.
    if (oldCycle !== newCycle) {
      this.sekshi.setCycle(newCycle, () => {
        if (!newCycle) {
          this.sekshi.sendChat(`@djs DJ Cycle has been disabled! ` +
                               `Remember to rejoin the wait list after your play.`)
        }
      })
    }
  }

  @command('eatshit', 'es', { role: command.ROLE.BOUNCER })
  eatshit(user, targetName, duration = 'd') {
    this.sekshi.findUser(targetName).then(target => {
      const emotes = this.sekshi.getModule('emotes')
      emotes && emotes.emote(user, 'eatshit', target.username)
      this.mute(user, targetName)
      setTimeout(() => {
        this.ban(user, targetName, duration)
      }, this.options.eatshitDelay * 1000)
    })
  }

  // alias to !lastroulette, !lasttrivia
  @command('lastgame', { role: command.ROLE.BOUNCER })
  lastgame(user) {
    const roulette = this.sekshi.getModule('roulette')
    const trivia = this.sekshi.getModule('trivia')

    if (roulette && roulette.enabled()) {
      roulette.lastroulette(user)
    }
    if (trivia && trivia.enabled()) {
      trivia.lasttrivia(user)
    }
  }

}
