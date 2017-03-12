import { Plugin, command, permissions } from 'munar-core'
import request from 'request'
import Promise from 'bluebird'

const debug = require('debug')('munar:emotes')

import { EmoteModel } from './models'
import { renderEmotesList } from './serve'

const cleanId = (id) => id.toLowerCase()

const IMGUR = /^https?:\/\/i\.imgur\.com\//

export default class Emotes extends Plugin {
  static description = 'Reaction GIF repository'

  static defaultOptions = {
    url: false,
    reupload: false,
    key: ''
  }

  constructor (bot, options) {
    super(bot, options)

    this.models({
      Emote: EmoteModel
    })
  }

  sendEmote (message, target, emote) {
    if (target) {
      message.send(`@${target.username} ${emote}`)
    } else {
      message.reply(emote)
    }
  }

  saveEmote (user, id, url) {
    const Emote = this.model('Emote')
    return Emote.findByIdAndUpdate(
      id,
      { url, addedBy: user.id },
      { upsert: true }
    )
  }

  upload (form) {
    return new Promise((resolve, reject) => {
      request.post('https://api.imgur.com/3/image', {
        headers: {
          Authorization: `Client-ID ${this.options.key}`
        },
        form: form
      }, (e, res, body) => {
        if (body) {
          body = JSON.parse(body)
          if (body.success) {
            return resolve(body.data.link.replace('http:', 'https:'))
          } else {
            console.log(body)
          }
        }
        reject(e)
      })
    })
  }

  reupload (title, url, cb) {
    return this.upload({
      type: 'url',
      title: title,
      image: url
    })
  }

  @command('addemote', { role: permissions.MODERATOR, ninjaVanish: true })
  async addemote (message, id, url) {
    const user = message.user
    id = cleanId(id)
    debug('addemote', id, url)
    let emote = null
    if (this.options.reupload && this.options.key && !IMGUR.test(url)) {
      message.reply(':satellite: Reuploading to imgur', 10 * 1000)
      try {
        const imgurUrl = await this.reupload(id, url)
        emote = await this.saveEmote(user, id, imgurUrl)
      } catch (e) {
        message.reply(
          ':warning: Could not reupload to imgur, ' +
          'using the original URL instead...',
          3 * 1000
        )
      }
    }
    if (!emote) {
      emote = await this.saveEmote(user, id, url)
    }
    debug('added', id, url)
    message.reply(`Emote "${id}" updated!`, 10 * 1000)
  }

  @command('delemote', { role: permissions.MODERATOR })
  async delemote (message, id) {
    debug('delemote', id)
    await this.model('Emote').remove({ _id: id })
    debug('deleted', id)

    message.reply(`Emote "${id}" removed!`, 10 * 1000)
  }

  @command('emotes')
  async emotes (message) {
    debug('listing emotes')
    let url

    const server = this.bot.getPlugin('serve')
    if (server) {
      url = server.getUrl('emotes')
    }
    if (this.options.url) {
      url = this.options.url
    }

    if (url) {
      message.reply(`Emotes can be found at ${url} !`)
      return
    }
    const emotes = await this.model('Emote').find().sort('id')
    const emoteIds = emotes.map((emote) => emote.id)
    message.reply(`Emotes: ${emoteIds.join(', ')}`)
  }

  @command('emote', 'e')
  async emote (message, id, username) {
    if (!id) return

    let target
    if (username) {
      if (username.charAt(0) === '@') {
        username = username.slice(1)
      }
      target = message.source.getUserByName(username)
    }
    if (!target) {
      target = message.user
    }

    const emote = await this.model('Emote').findById(cleanId(id))
    if (emote) {
      this.sendEmote(message, target, emote.url)
    }
  }

  async serve (req, res) {
    res.setHeader('content-type', 'text/html')

    const emotes = await this.model('Emote').find().sort('id')
    return renderEmotesList(emotes)
  }
}
