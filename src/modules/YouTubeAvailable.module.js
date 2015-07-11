const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:youtube-available')
const request = require('request')

export default class YouTubeAvailable extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Autoskips videos that are blocked and notifies staff if a video might not be available everywhere.'

    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      key: false,
      api: 'https://www.googleapis.com/youtube/v3/videos',

      skipTerminated: true,
      notifyRegionBlocked: false,
      allowedThreshold: 50,
      blockedThreshold: 100
    }
  }

  init() {
    if (!this.options.key) {
      this.sekshi.sendChat(
        `@staff The YouTube Availability module needs a YouTube API key. ` +
        `Please set it using '!set youtubeavailable key API_KEY_HERE'.`
      )
    }

    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance() {
    const media = this.sekshi.getCurrentMedia()
    const modSkip = this.sekshi.getModule('modskip')
    const sekshi = this.sekshi.getSelf()
    if (media && media.format === 1 && this.options.key) {
      let url = `${this.options.api}?id=${media.cid}&part=contentDetails,status&key=${this.options.key}`
      request(url, (e, _, body) => {
        if (e) return debug('yt-api-err', e)
        try {
          let json = JSON.parse(body)
          if (this.options.skipTerminated) {
            if (json.items.length === 0) {
              modSkip.lockskip(sekshi, 'unavailable')
              return
            }

            let status = json.items[0].status
            if (status.uploadStatus === 'rejected' || status.embeddable === false) {
              modSkip.lockskip(sekshi, 'unavailable')
              return
            }
          }
          debug('not terminated')

          if (this.options.notifyRegionBlocked) {
            let restriction = json.items[0].contentDetails.regionRestriction
            if (!restriction) return

            let { blocked, allowed } = restriction
            debug('blocked in', blocked ? blocked.length : null)
            debug('allowed in', allowed ? allowed.length : null)
            if (blocked && blocked.length > this.options.blockedThreshold) {
              this.sekshi.sendChat(
                `@staff This video is unavailable in ${restriction.blocked.length} ` +
                `countries. It may have to be skipped.`)
              return
            }
            else if (allowed && allowed.length <= this.options.allowedThreshold) {
              this.sekshi.sendChat(
                `@staff This video is only available in ${restriction.allowed.length} ` +
                `countries. It may have to be skipped.`)
              return
            }
          }
          debug('not region blocked')
        }
        catch (e) {}
      })
    }
  }

}