const SekshiModule = require('../Module')
const mongoose = require('mongoose')

const Achievement = mongoose.modelNames().indexOf('Achievement') === -1
  ? mongoose.model('Achievement', {
      _id: String,
      image: String,
      description: String
    })
  : mongoose.model('Achievement')

const AchievementUnlock = mongoose.modelNames().indexOf('AchievementUnlock') === -1
  ? mongoose.model('AchievementUnlock', {
      achievement: { type: String, ref: 'Achievement',  },
      user: { type: Number, ref: 'User' },
      giver: { type: Number, ref: 'User' },
      time: { type: Date, default: Date.now }
    })
  : mongoose.model('AchievementUnlock')

export default class Achievements extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.version = '0.1.0'
    this.description = 'Achievements.'

    this.permissions = {
      addachievement: sekshi.USERROLE.COHOST,
      giveachievement: sekshi.USERROLE.BOUNCER,
      ga: sekshi.USERROLE.BOUNCER
    }

    this.ninjaVanish = [ 'addachievement' ]

    this.Achievement = Achievement
    this.AchievementUnlock = AchievementUnlock
  }

  defaultOptions() {
    return {
      showDescription: false
    }
  }

  getUnlockedAchievements(uid) {
    return AchievementUnlock.find({ user: uid }, [ 'achievement' ]).lean().exec()
      .then(unlocked => unlocked.map(ach => ach.achievement))
      .catch(e => [])
  }

  hasAchievement(id, name) {
    return AchievementUnlock.count({
      user: id,
      achievement: name
    }).exec().then(
      num => num > 0,
      e => false
    )
  }

  defineAchievement({ name, image, description }) {
    return Achievement.create({ _id: name, image, description })
  }

  unlockAchievement(user, achievement) {
    // normalise achievement name
    achievement = achievement.toLowerCase()
    return this.hasAchievement(user, achievement).then(has => {
      if (has) {
        return null
      }
      return AchievementUnlock.create({
        user,
        achievement,
      })
    })
  }

  addachievement({ username }, name, image, ...description) {
    description = description.join(' ')
    let e
    if (!name) e = `You have to enter a name.`
    if (!image) e = `You have to add an image link.`

    if (e) return this.sekshi.sendChat(`@${username} ${e}`)

    // normalise achievement names
    name = name.toLowerCase()

    this.defineAchievement({ name, image, description }).then(
      ach => { this.sekshi.sendChat(`@${username} Created achievement "${ach.id}"!`) },
      e => { console.error(e.stack || e.message) }
    )
  }

  giveachievement(user, targetName, achievement) {
    const target = this.sekshi.getUserByName(targetName)
    if (target) {
      this.unlockAchievement(target.id, achievement).then(unlock => {
        if (unlock == null) {
          this.sekshi.sendChat(`@${user.username} ${target.username} ` +
                               `already has that achievement!`)
          return
        }
        unlock.set('giver', user.id).save()
        return Achievement.findById(unlock.achievement).exec().then(ach => {
          if (ach.description && this.options.showDescription) {
            this.sekshi.sendChat(ach.description)
          }
          this.sekshi.sendChat(`@${target.username} unlocked achievement ${ach.image}`)
        })
      }).then(null, e => {
        console.error(e.stack || e.message)
      })
    }
  }
  ga(...args) {
    this.giveachievement(...args)
  }

}