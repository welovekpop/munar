const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:mod-tools')

export default class ModTools extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '1.2.0'
    this.description = 'Provides moderation commands on the bot so you don\'t have to deal with plug\'s moderator UI.'

    this.permissions = {
      clearwaitlist: sekshi.USERROLE.MANAGER,
      lock: sekshi.USERROLE.MANAGER,
      unlock: sekshi.USERROLE.MANAGER,
      cycle: sekshi.USERROLE.BOUNCER,
      move: sekshi.USERROLE.BOUNCER,
      ban: sekshi.USERROLE.BOUNCER,
      mute: sekshi.USERROLE.BOUNCER,
      unmute: sekshi.USERROLE.BOUNCER,
      eatshit: sekshi.USERROLE.BOUNCER
    }
  }

  defaultOptions() {
    return {
      eatshitDelay: 20
    }
  }

  clearwaitlist(user) {
    this.sekshi.setLock(true, true, e => {
      if (e) debug('lock-err', e)
      else this.sekshi.setLock(false, false, e => {
        if (e) debug('unlock-err', e)
      })
    })
  }

  move(user, target, pos) {
    debug('move', target, pos)
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

  ban(user, targetName, duration = 'h') {
    if (duration !== 'h' && duration !== 'd' && duration !== 'f') {
      duration = 'h'
    }
    const target = this.sekshi.getUserByName(targetName)

    if (target) {
      this.sekshi.banUser(target.id, duration, e => {
        if (e) debug('ban-err', e)
      })
    }
  }

  mute(user, targetName, duration = 15) {
    duration = duration === 45 || duration === 'l' ? 'l'
             : duration === 30 || duration === 'm' ? 'm'
             : 's'

    const target = this.sekshi.getUserByName(targetName, true)
    if (target) {
      this.sekshi.muteUser(target.id, duration, 1, e => {
        if (e) debug('mute-err', e)
      })
    }
  }

  unmute(user, targetName) {
    const target = this.sekshi.getUserByName(targetName)
    if (target) {
      this.sekshi.unmuteUser(target.id, e => {
        if (e) debug('unmute-err', e)
      })
    }
  }

  lock(user, clear = false) {
    debug('locking waitlist', clear === 'clear' ? 'clearing' : 'not clearing')
    this.sekshi.setLock(true, clear === 'clear', e => {
      if (e) debug('lock-err', e)
    })
  }

  unlock(user) {
    debug('unlocking waitlist')
    this.sekshi.setLock(false, false, e => {
      if (e) debug('unlock-err', e)
    })
  }

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

  eatshit(user, targetName, duration = 'd') {
    const target = this.sekshi.getUserByName(targetName)
    if (target) {
      const emotes = this.sekshi.getModule('emotes')
      emotes && emotes.emote(user, 'eatshit', target.username)
      this.mute(user, targetName)
      setTimeout(() => {
        this.ban(user, targetName, duration)
      }, this.options.eatshitDelay * 1000)
    }
  }

}