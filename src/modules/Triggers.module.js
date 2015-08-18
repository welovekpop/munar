const debug = require('debug')('sekshi:triggers')
const SekshiModule = require('../Module')
const command = require('../command')
const { Trigger } = require('../models')

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

  parse(str, user, target = null) {
    let dj = this.sekshi.getCurrentDJ()
    let media = this.sekshi.getCurrentMedia()
    return str
      .replace(/\$user\b/gi, user.username)
      .replace(/\$dj\b/gi, () => dj ? dj.username : '')
      .replace(/\$artist\b/gi, () => media ? media.author : '')
      .replace(/\$title\b/gi, () => media ? media.title : '')
      .replace(/\$song\b/gi, () => media ? `${media.author} – ${media.title}` : '')
  }

  @command('trigger', { role: command.ROLE.BOUNCER })
  createTrigger(user, name, ...response) {
    console.log(arguments)
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
