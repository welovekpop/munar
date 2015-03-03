const SekshiModule = require('../Module')
const mongoose = require('mongoose')
const debug = require('debug')('sekshi:emotes')

const Emote = mongoose.modelNames().indexOf('Emote') === -1
  ? mongoose.model('Emote', {
      _id: String,
      url: String,
      time: { type: Date, default: Date.now },
      addedBy: { type: Number, ref: 'User' }
    })
  : mongoose.model('Emote')

const cleanId = id => id.toLowerCase()

export default class Emotes extends SekshiModule {
  constructor(sekshi, options) {
    this.author = 'ReAnna'
    this.version = '1.0.0'
    this.description = 'adds several emoticons as well as gifs and webms'

    super(sekshi, options)

    this.permissions = {
      thatsnono: sekshi.USERROLE.NONE,
      emotes: sekshi.USERROLE.NONE,
      addemote: sekshi.USERROLE.BOUNCER,
      delemote: sekshi.USERROLE.BOUNCER,
      emote: sekshi.USERROLE.NONE,
      e: sekshi.USERROLE.NONE
    }

    this.ninjaVanish = [ 'addemote' ]

    this.Emote = Emote
  }

  sendEmote(msg, username) {
    if (username) {
      let user = this.sekshi.getUserByName(username, true)
      if (user) {
        this.sekshi.sendChat(`@${user.username} ${msg}`)
        return
      }
    }
    this.sekshi.sendChat(msg)
  }

  addemote(user, id, url) {
    id = cleanId(id)
    debug('addemote', id, url)
    Emote.findByIdAndUpdate(
      id,
      { url, addedBy: user.id },
      { upsert: true }
    ).exec().then(
      emote => {
        debug('added', id, url)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" updated!`, 10 * 1000)
      },
      err => {
        debug('add-err', err)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" could not be updated`, 10 * 1000)
      })
  }

  delemote(user, id) {
    debug('delemote', id)
    Emote.remove({ _id: id }).exec().then(
      () => {
        debug('deleted', id)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" removed!`, 10 * 1000)
      },
      err => {
        debug('del-err', err)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" could not be updated`, 10 * 1000)
      }
    )
  }

  emotes({ username }) {
    debug('listing emotes')
    Emote.find({}).exec().then(
      emotes => {
        const MSG_INTERVAL = 600
        let message = `@${username} Emotes: `
        let messages = []
        debug('got emotes', emotes.length)
        emotes.forEach(e => {
          if (message.length + e.id.length > 250) {
            messages.push(message)
            message = ''
          }
          message += e.id + ', '
        })
        messages.push(message.substr(0, message.length - 2))
        debug('sending messages', messages.length)
        messages.forEach((msg, i) => {
          setTimeout(() => { this.sekshi.sendChat(msg, 20 * 1000 - i * MSG_INTERVAL) }, i * MSG_INTERVAL)
        })
      },
      err => { debug('error', err) }
    )
  }

  emote(user, id, username) {
    let target
    if (username) {
      if (username.charAt(0) === '@') username = username.slice(1)
      target = this.sekshi.getUserByName(username)
    }
    if (!target) target = user

    Emote.findById(id).exec().then(emote => {
      this.sendEmote(emote.url, target.username)
    })
  }

  e(...args) {
    this.emote(...args)
  }

  thatsnono(user, username) {
    if (username && username.charAt(0) === '@') username = username.slice(1)
    this.sendEmote('That\'s no no http://a.pomf.se/lcmeuw.webm', username)
  }
}
