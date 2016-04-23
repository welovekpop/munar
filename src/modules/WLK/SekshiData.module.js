import { Module, command } from '../../'

export default class WLKSekshiData extends Module {
  author = 'ReAnna'
  description = 'Quick links to sekshi-data pages.'

  defaultOptions () {
    return {
      url: 'https://my-website.com/sekshi-data/'
    }
  }

  base () {
    let base = this.options.url
    return base[base.length - 1] === '/' ? base : base + '/'
  }

  @command('profile')
  showProfileLink (message, targetName = null) {
    this.bot.findUser(targetName, message.user)
      .then((target) => {
        let slug = target.slug || target.id
        message.send(`@${target.username}'s profile page: ${this.base()}user/${slug}`)
      })
      .catch((e) => {
        message.reply(e.message)
      })
  }

  @command('songpage', 'mediapage')
  showMediaLink (message) {
    let media = this.bot.getCurrentMedia()
    if (!media) {
      message.reply('No song is playing right now.')
      return
    }
    message.reply(
      'Statistics & more for this video can be found at: ' +
      `${this.base()}media/${media.cid}`
    )
  }
}
