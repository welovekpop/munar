import { Module } from '../'
import request from 'request'

const debug = require('debug')('sekshi:youtube-available')

export default class YouTubeAvailable extends Module {
  author = 'ReAnna'
  description = 'Autoskips videos that are blocked and notifies staff if a video might not be available everywhere.'

  defaultOptions () {
    return {
      key: false,
      api: 'https://www.googleapis.com/youtube/v3/videos',

      skipTerminated: true,
      notifyRegionBlocked: false,
      allowedThreshold: 50,
      blockedThreshold: 100
    }
  }

  init () {
    if (!this.options.key) {
      this.bot.sendChat(
        '@staff The YouTube Availability module needs a YouTube API key. ' +
        'Please set it using "!set youtubeavailable key API_KEY_HERE".'
      )
    }

    this.bot.on(this.bot.ADVANCE, this.onAdvance)
  }
  destroy () {
    this.bot.removeListener(this.bot.ADVANCE, this.onAdvance)
  }

  onAdvance = () => {
    const media = this.bot.getCurrentMedia()
    const modSkip = this.bot.getModule('modskip')
    const self = this.bot.getSelf()
    if (media && media.format === 1 && this.options.key) {
      let url = `${this.options.api}?id=${media.cid}&part=contentDetails,status&key=${this.options.key}`
      request(url, (e, _, body) => {
        if (e) {
          return debug('yt-api-err', e)
        }
        try {
          let json = JSON.parse(body)
          if (this.options.skipTerminated) {
            if (json.items.length === 0) {
              modSkip.lockskip(self, 'unavailable')
              return
            }

            let status = json.items[0].status
            if (status.uploadStatus === 'rejected' || status.embeddable === false) {
              modSkip.lockskip(self, 'unavailable')
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
              this.bot.sendChat(
                `@staff This video is unavailable in ${restriction.blocked.length} ` +
                'countries. It may have to be skipped.'
              )
              return
            } else if (allowed && allowed.length <= this.options.allowedThreshold) {
              this.bot.sendChat(
                `@staff This video is only available in ${restriction.allowed.length} ` +
                'countries. It may have to be skipped.'
              )
              return
            }
          }
          debug('not region blocked')
        } catch (e) {
          // Nothing
        }
      })
    }
  }
}
