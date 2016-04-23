import { Module, command } from '../'
import mongoose from 'mongoose'
import Promise from 'bluebird'

const achievementSchema = {
  _id: String,
  image: String,
  description: String
}
const achievementUnlockSchema = {
  achievement: { type: String, ref: 'Achievement' },
  user: { type: Number, ref: 'User' },
  giver: { type: Number, ref: 'User' },
  time: { type: Date, default: Date.now }
}

const Achievement = mongoose.modelNames().indexOf('Achievement') === -1
  ? mongoose.model('Achievement', achievementSchema)
  : mongoose.model('Achievement')
const AchievementUnlock = mongoose.modelNames().indexOf('AchievementUnlock') === -1
  ? mongoose.model('AchievementUnlock', achievementUnlockSchema)
  : mongoose.model('AchievementUnlock')

export default class Achievements extends Module {
  version = '0.1.0'
  description = 'Achievements.'

  Achievement = Achievement
  AchievementUnlock = AchievementUnlock

  defaultOptions () {
    return {
      showDescription: false
    }
  }

  getUnlockedAchievements (uid) {
    return AchievementUnlock.find({ user: uid }, [ 'achievement' ]).lean().exec()
      .then((unlocked) => unlocked.map((ach) => ach.achievement))
      .catch((e) => [])
  }

  hasAchievement (id, name) {
    return AchievementUnlock.count({
      user: id,
      achievement: name
    }).exec().then(
      (num) => num > 0,
      (e) => false
    )
  }

  defineAchievement ({ name, image, description }) {
    return Achievement.create({ _id: name, image, description })
  }

  unlockAchievement (user, achievement) {
    // normalise achievement name
    achievement = achievement.toLowerCase()
    return Achievement.findById(achievement)
      .then((exists) => {
        if (!exists) {
          return Promise.reject(new Error(`Achievement ${achievement} does not exist`))
        }
        return this.hasAchievement(user, achievement)
      })
      .then((has) => {
        if (has) {
          return null
        }
        return AchievementUnlock.create({
          user,
          achievement
        })
      })
  }

  notifyUnlocked (unlock) {
    const target = this.bot.getUserByID(unlock.user)
    return Achievement.findById(unlock.achievement).then((ach) => {
      if (ach.description && this.options.showDescription) {
        this.bot.sendChat(ach.description)
      }
      this.bot.sendChat(`@${target.username} unlocked achievement ${ach.image}`)
    })
  }

  @command('addachievement', { role: command.ROLE.COHOST, ninjaVanish: true })
  addachievement ({ username }, name, image, ...description) {
    description = description.join(' ')
    let e
    if (!name) e = 'You have to enter a name.'
    if (!image) e = 'You have to add an image link.'

    if (e) return this.bot.sendChat(`@${username} ${e}`)

    // normalise achievement names
    name = name.toLowerCase()

    this.defineAchievement({ name, image, description }).then(
      (ach) => { this.bot.sendChat(`@${username} Created achievement "${ach.id}"!`) },
      (e) => { console.error(e.stack || e.message) }
    )
  }

  @command('giveachievement', 'ga', { role: command.ROLE.BOUNCER })
  giveachievement (user, targetName, achievement) {
    let target = this.bot.getUserByName(targetName)
    // take arguments in both orders (nice for autocomplete)
    if (!target) {
      [ targetName, achievement ] = [ achievement, targetName ]
      target = this.bot.getUserByName(targetName)
    }
    if (target) {
      this.unlockAchievement(target.id, achievement)
        .then((unlock) => {
          if (unlock == null) {
            this.bot.sendChat(
              `@${user.username} ${target.username} already has that achievement!`
            )
            return
          }
          unlock.set('giver', user.id).save()
          return this.notifyUnlocked(unlock)
        })
        .catch((e) => {
          console.error(e.stack || e.message)
        })
    } else {
      this.bot.sendChat(`@${user.username} I couldn't find that user!`)
    }
  }

}
