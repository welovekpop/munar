const SekshiModule = require('../../Module')
const command = require('../../command')
const debug = require('debug')('sekshi:wlk:tag-watcher')
const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const { authorTitle, fixTags } = require('../../utils')
const takeWhile = require('lodash.takewhile')
const assign = require('object-assign')

const toMedia = video => {
  let at = authorTitle(video.snippet.title)
  return {
    format: 1,
    cid: video.id,
    author: at.author || video.snippet.channelTitle || '?',
    title: at.title,
    image: video.snippet.thumbnails.default.url,
    duration: parseDuration(video.contentDetails.duration)
  }
}

const parseDuration = iso => {
  let match = iso.match(/^P([0-9]+D|)?T?([0-9]+H|)?([0-9]+M|)?([0-9]+S|)?$/)
  let duration = 0
  if (match[4]) duration += parseInt(match[4], 10)
  if (match[3]) duration += parseInt(match[3], 10) * 60
  if (match[2]) duration += parseInt(match[2], 10) * 3600
  if (match[1]) duration += parseInt(match[1], 10) * 86400
  return duration
}

export default class TagWatcher extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.description = 'Tries to fix the terrible k-pop tags situation by autofixing video tags as they are uploaded.'
  }

  defaultOptions() {
    return {
      key: false,
      api: 'https://www.googleapis.com/youtube/v3/',

      interval: 60, // seconds

      // "is this a song?" heuristic durations
      minDuration: 1.5 * 60,
      maxDuration: 7 * 60,

      // contains objects of shape
      // { playlist:  playlist ID
      // , title:     playlist title, for usability purposes
      // , processor: video processor name
      // , last:      last processed video ID }
      watchPlaylists: []
    }
  }

  init() {
    if (!this.options.key) {
      this.sekshi.sendChat(
        `@staff The YouTube k-pop tag autofixer module needs a YouTube API key. ` +
        `Please set it using \`!cf set WLK/TagWatcher key API_KEY_HERE\`.`
      )
    }
    setTimeout(() => {
      this.update()
      this.watch()
    }, 10000)
  }

  destroy() {
    clearTimeout(this._timeout)
  }

  api(url, data) {
    data.key = this.options.key
    return request({
      uri: `${this.options.api}${url}`,
      method: 'get',
      qs: data,
      json: true
    }).get(1)
  }

  getChannel(nameOrId) {
    return this.api('channels', { part: 'contentDetails', forUsername: nameOrId })
      .then(res => res.items.length
          ? res
          : this.api('channels', { part: 'contentDetails', id: nameOrId }))
      .then(res => res.items.length
          ? res.items[0]
          : Promise.reject(new Error('Channel not found')))
  }

  watch() {
    if (this.enabled()) {
      this._timeout = setTimeout(() => {
        this.update().finally(this.watch.bind(this))
      }, this.options.interval * 1000)
    }
  }

  @command('tagwatch', { role: command.ROLE.COHOST })
  addWatcher(user, channel, processor = 'generic') {
    if (!channel) {
      return this.sekshi.sendChat(`@${user.username} Pass a channel username/id`)
    }

    this.getChannel(channel)
      .then(channel => channel.contentDetails.relatedPlaylists.uploads)
      .then(playlistId => this.api('playlists', { part: 'snippet', id: playlistId }))
      .then(res => res.items.length
          ? res.items[0]
          : Promise.reject(new Error('Uploads playlist not found')))
      .then(playlist => {
        if (this.options.watchPlaylists.some(watch => watch.playlist === playlist.id)) {
          return this.sekshi.sendChat(
            `@${user.username} "${playlist.snippet.title}" is already on the watch list.`
          )
        }

        this.setOption('watchPlaylists', this.options.watchPlaylists.concat([ {
          playlist: playlist.id,
          title: playlist.snippet.title,
          processor: processor,
          last: null
        } ]))
        this.sekshi.sendChat(
          `@${user.username} Watching "${playlist.snippet.title}" for new videos!`
        )
      })
      .catch(console.error)
  }

  update() {
    debug('updating')
    let seq = Promise.resolve()
    this.options.watchPlaylists.forEach(watch => {
      seq = seq
        .then(() => this.api('playlistItems', { part: 'snippet', playlistId: watch.playlist }))
        .get('items')
        .then(items => {
          if (!items.length) {
            return Promise.reject(`Playlist ${watch.playlist} (${watch.title}) not found`)
          }

          let add = takeWhile(items, item => item.snippet.resourceId
                                          && item.snippet.resourceId.videoId !== watch.last)
          if (add.length === 0) return

          debug('new videos', add.map(item => {
            return `${item.snippet.title} (${item.snippet.resourceId.videoId})`
          }).join(', '))

          let videoIds = add.map(item => item.snippet.resourceId.videoId)
          return this.api('videos', { part: 'snippet,contentDetails', id: videoIds.join(',') })
            .get('items')
            .map(toMedia)
            // set last processed video
            .tap(medias => { watch.last = medias[0].cid })

            // start autofixing magic!
            .filter(media => media.duration >= this.options.minDuration
                          && media.duration <= this.options.maxDuration)
            .map(media => assign(media, fixTags(media)))
            .then(medias => this.addToPlaylist(watch, medias))

            // store last processed video ID in config
            .tap(() => this.saveOptions())

            //
            .catch(e => console.error(e.stack || e.message))
        })
        // clean slate for the next playlist
        .return(null)
    })
    return seq
  }

  addToPlaylist(watch, medias) {
    let buster = Date.now() % 100000
    let addPlaylist = Promise.promisify(this.sekshi.addPlaylist.bind(this.sekshi))
    return addPlaylist(`${watch.title} #${buster}`, medias)
  }

}
