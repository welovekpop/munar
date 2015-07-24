const Snoocore = require('snoocore')
const debug = require('debug')('sekshi:reddit-feed')
const Promise = require('bluebird')
const SekshiModule = require('../Module')

export default class RedditFeed extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'schrobby'
    this.description = 'Announces new submissions from a configurable list of subreddits.'

    this.reddit = new Snoocore({ userAgent: `RedditFeed v${this.version} by /u/schrobby` })
  }

  defaultOptions() {
    return {
      subreddits: [ 'kpop' ],
      interval: 300000,
      format: '%feed | %title by %submitter | %link'
    }
  }

  init() {
    this.lastPost = ''
    this.timer = setTimeout(this.runTimer.bind(this), 0)
  }

  destroy() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  @command('updatereddit', { role: command.ROLE.MANAGER })
  updatereddit() {
    clearTimeout(this.timer)
    this.runTimer()
  }

  runTimer() {
    debug('fetching new posts')
    const subs = this.options.subreddits
    var posts = []
    var requests = []
    var chunk = 50

    for (let i = 0, l = subs.length; i < l; i += chunk) {
      requests.push(subs.slice(i, i + chunk).join('+'))
    }

    let promises = requests.map(uri => {
      return this.reddit('/r/$subreddit/new')
        .listing({
          $subreddit: uri,
          before: this.lastPost,
          limit: 100
        })
        .then(result => result.children)
    })

    Promise.all(promises)
      .then(results => {
        let posts = results.reduce((posts, list) => posts.concat(list), [])
        debug('got new posts', posts.length)
        if (this.lastPost && this.enabled()) {
          posts.forEach(post => {
            this.sekshi.sendChat(`[r/kpop] ${post.data.author} posted: ` +
                              `${post.data.title} https://reddit.com/${post.data.id}`)
          })
        }

        if (posts.length > 0) {
          /*@TODO: find a way to reliably get the most recent post */
          this.lastPost = posts[0].data.name
        }

        this.timer = setTimeout(this.runTimer.bind(this), this.options.interval)
      })
      .catch(e => { debug('reddit error', e) })
  }

}
