const SekshiModule = require('../Module')
const command = require('../command')
const mongoose = require('mongoose')
const debug = require('debug')('sekshi:emotes')
const request = require('request')
const Promise = require('bluebird')

const Emote = mongoose.modelNames().indexOf('Emote') === -1
  ? mongoose.model('Emote', {
      _id: String,
      url: String,
      time: { type: Date, default: Date.now },
      addedBy: { type: Number, ref: 'User' }
    })
  : mongoose.model('Emote')

const cleanId = id => id.toLowerCase()

const IMGUR = /^https?:\/\/i\.imgur\.com\//

export default class Emotes extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'adds several emoticons as well as gifs and webms'

    this.Emote = Emote
  }

  defaultOptions() {
    return {
      url: false,
      reupload: false,
      key: ''
    }
  }

  sendEmote(message, target, emote) {
    if (target) {
      message.send(`@${target.name} ${emote}`)
    } else {
      message.reply(emote)
    }
  }

  saveEmote(user, id, url) {
    return Emote.findByIdAndUpdate(
      id,
      { url, addedBy: user.id },
      { upsert: true }
    ).exec()
  }

  upload(form) {
    return new Promise((resolve, reject) => {
      let upload = request.post('https://api.imgur.com/3/image', {
        headers: {
          Authorization: `Client-ID ${this.options.key}`
        },
        form: form
      }, (e, res, body) => {
        if (body) {
          body = JSON.parse(body)
          if (body.success) {
            return resolve(body.data.link.replace('http:', 'https:'))
          }
          else {
            console.log(body)
          }
        }
        reject(e)
      })
    })
  }

  reupload(title, url, cb) {
    return this.upload({
      type: 'url',
      title: title,
      image: url
    })
  }

  @command('addemote', { role: command.ROLE.BOUNCER, ninjaVanish: true })
  addemote(message, id, url) {
    const user = message.user
    id = cleanId(id)
    debug('addemote', id, url)
    let promise = null
    if (this.options.reupload && this.options.key && !IMGUR.test(url)) {
      message.reply(`:satellite: Reuploading to imgur`, 10 * 1000)
      promise = this.reupload(id, url)
        .then(imgurUrl => this.saveEmote(user, id, imgurUrl))
        .catch(err => {
          message.reply(
            `:warning: Could not reupload to imgur, ` +
            `using the original URL instead...`
          , 3 * 1000
          )
          return this.saveEmote(user, id, url)
        })
    }
    else {
      promise = this.saveEmote(user, id, url)
    }
    return promise.then(emote => {
      debug('added', id, url)
      message.reply(`Emote "${id}" updated!`, 10 * 1000)
    })
  }

  @command('delemote', { role: command.ROLE.BOUNCER })
  delemote(user, id) {
    debug('delemote', id)
    return Emote.remove({ _id: id }).exec()
      .then(() => {
        debug('deleted', id)
        message.reply(`Emote "${id}" removed!`, 10 * 1000)
      })
  }

  @command('emotes')
  emotes(message) {
    debug('listing emotes')
    if (this.options.url) {
      message.reply(`Emotes can be found at ${this.options.url} !`)
      return
    }

    return Emote.find({}).sort('id').exec()
      .map(e => e.id)
      .then(emotes => message.reply(`Emotes: ${emotes.join(', ')}`))
  }

  @command('emote', 'e')
  emote(message, id, username) {
    if (!id) return

    let target
    if (username) {
      if (username.charAt(0) === '@') username = username.slice(1)
      target = message.source.getUserByName(username)
    }
    if (!target) target = message.user

    Emote.findById(cleanId(id)).exec().then(emote => {
      if (emote) {
        this.sendEmote(message, target, emote.url)
      }
    })
  }

  @command('thatsnono')
  thatsnono(message, username) {
    let target
    if (username) {
      if (username.charAt(0) === '@') username = username.slice(1)
      target = message.source.getUserByName(username)
    }
    this.sendEmote(message, target, 'That\'s no no http://a.pomf.se/lcmeuw.webm')
  }
}
