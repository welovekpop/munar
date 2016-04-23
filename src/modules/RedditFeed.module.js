import { Module, command } from '../'
import Snoocore from 'snoocore'
import Promise from 'bluebird'
import decode from 'ent/decode'

const debug = require('debug')('sekshi:reddit-feed')

export default class RedditFeed extends Module {
  author = 'schrobby'
  description = 'Announces new submissions from a configurable list of subreddits.'

  reddit = new Snoocore({ userAgent: `RedditFeed v${this.version} by /u/schrobby` })

  defaultOptions () {
    return {
      output: [],
      subreddits: [ 'kpop' ],
      interval: 300000,
      format: '[r/$subreddit] $poster posted: $title $posturl'
    }
  }

  init () {
    this.lastPost = ''
    this.timer = setTimeout(() => {
      this.runTimer()
    }, 0)
  }

  destroy () {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  getOutput () {
    const [ adapterName, channel ] = this.options.output
    return this.adapter(adapterName).getChannel(channel)
  }

  @command('updatereddit', { role: command.ROLE.MANAGER })
  updatereddit () {
    clearTimeout(this.timer)
    this.runTimer()
  }

  runTimer () {
    debug('fetching new posts')
    const subs = this.options.subreddits
    var requests = []
    var chunk = 50

    for (let i = 0, l = subs.length; i < l; i += chunk) {
      requests.push(subs.slice(i, i + chunk).join('+'))
    }

    let promises = requests.map((uri) => {
      return this.reddit('/r/$subreddit/new')
        .listing({
          $subreddit: uri,
          before: this.lastPost,
          limit: 100
        })
        .then((result) => result.children)
    })

    Promise.all(promises)
      .then((results) => {
        let posts = results.reduce((posts, list) => posts.concat(list), [])
        debug('got new posts', posts.length)
        if (this.lastPost && this.enabled()) {
          posts.forEach((post) => {
            let message = this.options.format
              .replace(/\$subreddit\b/g, post.data.subreddit)
              .replace(/\$poster\b/g, post.data.author)
              .replace(/\$title\b/g, () => decode(post.data.title))
              .replace(/\$url\b/g, post.data.url)
              .replace(/\$posturl\b/g, `https://reddit.com/${post.data.id}`)
            this.getOutput().sendChat(message)
          })
        }

        if (posts.length > 0) {
          /* @TODO: find a way to reliably get the most recent post */
          this.lastPost = posts[0].data.name
        }

        this.timer = setTimeout(() => {
          this.runTimer()
        }, this.options.interval)
      })
      .catch((e) => { debug('reddit error', e) })
  }
}
