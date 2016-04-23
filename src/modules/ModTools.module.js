import { Module, command } from '../'
import User from '../models/User'
import escapeStringRegExp from 'escape-string-regexp'

const debug = require('debug')('sekshi:mod-tools')

export default class ModTools extends Module {
  author = 'ReAnna'
  description = 'Provides moderation commands on the bot so you don\'t have to deal with plug\'s moderator UI.'

  defaultOptions () {
    return {
      eatshitDelay: 20
    }
  }

  @command('clearwaitlist', { role: command.ROLE.MANAGER })
  async clearwaitlist (message) {
    await message.source.clearWaitlist()
  }

  @command('move', { role: command.ROLE.BOUNCER })
  async move (message, target, pos) {
    debug('move', target, pos)
    if (!/^\d+$/.test(pos)) {
      return message.reply('Invalid position!')
    }
    pos = parseInt(pos, 10) - 1
    let targetUser = message.source.getUserByName(target)
    if (targetUser) {
      await message.source.moveWaitlistUser(targetUser.id, pos)
    } else {
      message.reply(`I don't know "${target}"!`)
    }
  }

  @command('ban', { role: command.ROLE.BOUNCER })
  async ban (message, targetName, duration = 'h') {
    if (duration !== 'h' && duration !== 'd' && duration !== 'f') {
      duration = 'h'
    }
    const target = await User.findOne({
      adapter: message.source.constructor.adapterName,
      username: `/^${escapeStringRegExp(targetName)}$/i`
    })
    if (target) {
      message.source.banUser(target.id)
    }
  }

  @command('unban', { role: command.ROLE.BOUNCER })
  async unban (message, targetName) {
    this.bot.findUser(targetName).then((target) => {
      this.bot.unbanUser(target.id, (error) => {
        if (error) {
          debug('ban-err', error)
        } else {
          message.send(`@${message.username} Unbanned ${target.username}`)
        }
      })
    })
  }

  @command('kick', { role: command.ROLE.BOUNCER })
  kick (message, targetName) {
    this.bot.findUser(targetName).then((target) => {
      this.bot.banUser(target.id, 'h', (e) => {
        if (e) return debug('kick-err', e)
        this.bot.unbanUser(target.id, (e) => {
          if (e) debug('kick-err', e)
          if (target.role > 0) {
            this.bot.addStaff(target.id, target.role, (e) => {
              if (e) debug('kick-err', e)
            })
          }
        })
      })
    })
  }

  @command('mute', { role: command.ROLE.BOUNCER })
  mute (message, targetName, duration = 15) {
    duration = duration === 45 || duration === 'l' ? 'l'
             : duration === 30 || duration === 'm' ? 'm'
             : 's'

    this.bot.findUser(targetName).then((target) => {
      this.bot.muteUser(target.id, duration, 1, (e) => {
        if (e) debug('mute-err', e)
      })
    })
  }

  @command('unmute', { role: command.ROLE.BOUNCER })
  unmute (message, targetName) {
    this.bot.findUser(targetName).then((target) => {
      this.bot.unmuteUser(target.id, (e) => {
        if (e) debug('unmute-err', e)
      })
    })
  }

  @command('lock', { role: command.ROLE.MANAGER })
  lock (message, clear = false) {
    debug('locking waitlist', clear === 'clear' ? 'clearing' : 'not clearing')
    this.bot.setLock(true, clear === 'clear', (e) => {
      if (e) debug('lock-err', e)
    })
  }

  @command('unlock', { role: command.ROLE.MANAGER })
  unlock (message) {
    debug('unlocking waitlist')
    this.bot.setLock(false, false, (e) => {
      if (e) debug('unlock-err', e)
    })
  }

  @command('cycle', { role: command.ROLE.MANAGER })
  cycle (message, set = 'toggle') {
    let oldCycle = this.bot.doesWaitlistCycle()
    let newCycle = set === 'toggle'
      ? !oldCycle
      : set !== 'off' // anything that isn't "off" _enables_ dj cycle.
    if (oldCycle !== newCycle) {
      this.bot.setCycle(newCycle, () => {
        if (!newCycle) {
          this.bot.sendChat(
            '@djs DJ Cycle has been disabled! ' +
            'Remember to rejoin the wait list after your play.'
          )
        }
      })
    }
  }

  @command('eatshit', 'es', { role: command.ROLE.BOUNCER })
  eatshit (message, targetName, duration = 'd') {
    this.bot.findUser(targetName).then((target) => {
      const emotes = this.bot.getModule('emotes')
      emotes && emotes.emote(message, 'eatshit', target.username)
      this.mute(message, targetName)
      setTimeout(() => {
        this.ban(message, targetName, duration)
      }, this.options.eatshitDelay * 1000)
    })
  }

  // alias to !lastroulette, !lasttrivia
  @command('lastgame', { role: command.ROLE.BOUNCER })
  lastgame (message) {
    const roulette = this.bot.getModule('roulette')
    const trivia = this.bot.getModule('trivia')

    if (roulette && roulette.enabled()) {
      roulette.lastroulette(message.user)
    }
    if (trivia && trivia.enabled()) {
      trivia.lasttrivia(message.user)
    }
  }
}
