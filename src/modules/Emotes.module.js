const SekshiModule = require('../Module')
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

  defaultOptions() {
    return {
      url: false,
      reupload: false,
      key: ''
    }
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

  addemote(user, id, url) {
    id = cleanId(id)
    debug('addemote', id, url)
    let promise = null
    if (this.options.reupload && this.options.key && !IMGUR.test(url)) {
      this.sekshi.sendChat(`@${user.username} :satellite: Reuploading to imgur`, 10 * 1000)
      promise = this.reupload(id, url)
        .then(imgurUrl => this.saveEmote(user, id, imgurUrl))
        .catch(err => {
          this.sekshi.sendChat(
            `@${user.username} :warning: Could not reupload to imgur, ` +
            `using the original URL instead...`
          , 3 * 1000
          )
          return this.saveEmote(user, id, url)
        })
    }
    else {
      promise = this.saveEmote(user, id, url)
    }
    promise
      .then(emote => {
        debug('added', id, url)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" updated!`, 10 * 1000)
      })
      .catch(err => {
        debug('add-err', err)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" could not be updated`, 10 * 1000)
      })
  }

  delemote(user, id) {
    debug('delemote', id)
    Emote.remove({ _id: id }).exec()
      .then(() => {
        debug('deleted', id)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" removed!`, 10 * 1000)
      })
      .catch(err => {
        debug('del-err', err)
        this.sekshi.sendChat(`@${user.username} Emote "${id}" could not be updated`, 10 * 1000)
      })
  }

  emotes({ username }) {
    debug('listing emotes')
    if (this.options.url) {
      this.sekshi.sendChat(`@${username} Emotes can be found at ${this.options.url} !`)
      return
    }

    Emote.find({}).sort('id').exec()
      .then(emotes => {
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
        messages.forEach((msg, i) => {
          this.sekshi.sendChat(msg, 20 * 1000)
        })
      })
      .catch(err => { console.error(err) })
  }

  emote(user, id, username) {
    let target
    if (username) {
      if (username.charAt(0) === '@') username = username.slice(1)
      target = this.sekshi.getUserByName(username)
    }
    if (!target) target = user

    Emote.findById(cleanId(id)).exec().then(emote => {
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
