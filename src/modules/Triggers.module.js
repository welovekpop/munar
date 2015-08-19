const debug = require('debug')('sekshi:triggers')
const SekshiModule = require('../Module')
const command = require('../command')
const { Trigger } = require('../models')
const random = require('random-item')

export default class Triggers extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Throws text at people.'
  }

  init() {
    Trigger.find().exec().each(link => {
      this.add(link._id, link.response)
    })
  }

  add(name, response) {
    this.addCommand(name, (...params) => {
      this.sekshi.sendChat(this.parse(response, ...params))
    })
  }

  // Parses a response string with $variables.
  // Available variables:
  //  * $user -> Username of the user who used the trigger
  //  * $dj -> Username of the current DJ
  //  * $bot -> Username of the bot
  //  * $artist -> Artist of the current media
  //  * $title -> Title of the current media
  //  * $song -> Artist - Title of the current media
  //  * $anyone -> Username of a random user
  //  * $target -> Username of the target of this trigger (eg. !slap @TargetUsername)
  //  * $target{expression} -> Username of the target, or `expression` if no target is given.
  //                           (The expression can also contain variables.)
  parse(str, user, targetName = null) {
    let dj = this.sekshi.getCurrentDJ()
    let media = this.sekshi.getCurrentMedia()
    let bot = this.sekshi.getSelf()
    let target = targetName ? this.sekshi.getUserByName(targetName) : null
    return str
      .replace(/\$user\b/gi, user.username)
      .replace(/\$dj\b/gi, () => dj ? dj.username : '')
      .replace(/\$bot\b/gi, bot.username)
      .replace(/\$artist\b/gi, () => media ? media.author : '')
      .replace(/\$title\b/gi, () => media ? media.title : '')
      .replace(/\$song\b/gi, () => media ? `${media.author} – ${media.title}` : '')
      .replace(/\$anyone\b/gi, () => {
        let anyone = random(this.sekshi.getUsers())
        return anyone ? anyone.username : ''
      })
      .replace(/\$target(?:\{(.*?)\})?/gi, ($0, defaultTarget) => {
        return target ? target.username
             : targetName ? targetName
             : defaultTarget ? defaultTarget
             : user.username
      })
  }

  @command('trigger', { role: command.ROLE.BOUNCER })
  createTrigger(user, name, ...response) {
    name = name.toLowerCase()
    response = response.join(' ')
    if (name[0] === this.sekshi.delimiter) {
      name = name.slice(1)
    }
    let trig = new Trigger({
      _id: name,
      response: response,
      user: user.id
    })
    trig.save()
      .then(() => {
        this.sekshi.sendChat(`@${user.username} Created trigger "!${name}"`)
        this.add(name, response)
      })
      .catch(e => {
        console.error(e.stack || e.message)
        this.sekshi.sendChat(`@${user.username} Could not add trigger...`)
      })
  }

  @command('deltrigger', { role: command.ROLE.BOUNCER })
  removeTrigger(user, name) {
    name = name.toLowerCase()
    if (name[0] === this.sekshi.delimiter) {
      name = name.slice(1)
    }
    Trigger.remove({ _id: name }).then(removed => {
      this.sekshi.sendChat(`@${user.username} Removed trigger "!${name}"`)
    })
  }
}
