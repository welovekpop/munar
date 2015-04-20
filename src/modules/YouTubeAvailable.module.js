const SekshiModule = require('../Module')
const debug = require('debug')('sekshi:youtube-available')
const request = require('request')

export default class YouTubeAvailable extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.version = '0.0.1'
    this.description = 'Notifies staff if a video might not be available.'

    this.onAdvance = this.onAdvance.bind(this)
  }

  defaultOptions() {
    return {
      key: false,
      api: 'https://www.googleapis.com/youtube/v3/videos'
    }
  }

  init() {
    if (!this.options.key) {
      this.sekshi.sendChat(`@staff The YouTube Availability module needs a YouTube API key. Please set it using '!set youtubeavailable key API_KEY_HERE'.`)
    }

    this.sekshi.on(this.sekshi.ADVANCE, this.onAdvance)
  }
  destroy() {
    this.sekshi.removeListener(this.sekshi.ADVANCE, this.onAdvance)
  }

  onAdvance() {
    const media = this.sekshi.getCurrentMedia()
    if (media && media.format === 1 && this.options.key) {
      let url = `${this.options.api}?id=${media.cid}&part=contentDetails&key=${this.options.key}`
      request(url, (e, _, body) => {
        if (e) return debug('yt-api-err', e)
        try {
          let json = JSON.parse(body)
          let restriction = json.items[0].contentDetails.regionRestriction
          if (!restriction || restriction.length === 0) return
          if (restriction.blocked) {
            this.sekshi.sendChat(`@ReAnna This video is unavailable in ${restriction.blocked.length} countries.`)
          }
          if (restriction.allowed) {
            this.sekshi.sendChat(`@ReAnna This video is only available in ${restriction.allowed.length} countries.`)
          }
        }
        catch (e) {}
      })
    }
  }

}