const SekshiModule = require('../../Module')
const command = require('../../command')

export default class WLKSekshiData extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Quick links to sekshi-data pages.'
  }

  defaultOptions() {
    return {
      url: 'https://my-website.com/sekshi-data/'
    }
  }

  base() {
    let base = this.options.url
    return base[base.length - 1] === '/' ? base : base + '/'
  }

  @command('profile')
  showProfileLink(user, targetName = null) {
    let target = targetName && this.sekshi.getUserByName(targetName) || user
    let slug = target.slug || target.id

    this.sekshi.sendChat(`@${target.username}'s profile page: ${this.base()}user/${slug}`)
  }

  @command('songpage', 'mediapage')
  showMediaLink(user) {
    let media = this.sekshi.getCurrentMedia()
    if (!media) {
      this.sekshi.sendChat(`@${user.username} No song is playing right now.`)
      return
    }
    this.sekshi.sendChat(
      `@${user.username} Statistics & more for this video can be found at: ` +
      `${this.base()}media/${media.cid}`)
  }
}
