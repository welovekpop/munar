import got from 'got'
import { Plugin } from 'munar-core'

export default class RedditFeed extends Plugin {
  static defaultOptions = {
    subreddits: [],
    template: '[r/$subreddit] $title https://redd.it/$id',
    output: '',
    interval: 60 // seconds
  }

  timer = null

  enable () {
    this.lastId = null
    this.startPolling()
  }

  disable () {
    clearTimeout(this.timer)
  }

  stringifyPost (post) {
    return this.options.template.replace(/\$(\w+)/g,
      ($0, prop) => post.data[prop] || $0
    )
  }

  async poll () {
    const { subreddits } = this.options
    if (subreddits.length === 0) {
      return
    }
    const multi = subreddits.map(encodeURIComponent).join('+')
    const before = this.lastId ? `?before=${this.lastId}` : ''
    const res = await got(`https://reddit.com/r/${multi}/new.json${before}`, { json: true })
    if (!res) {
      return
    }
    const source = this.bot.getChannel(this.options.output)
    if (!source) {
      return
    }
    const posts = res.body.data.children
    if (this.lastId) {
      for (const post of posts) {
        const line = this.stringifyPost(post)
        source.send(line)
      }
    }
    if (posts.length > 0) {
      this.lastId = posts[0].data.name
    }
  }

  async startPolling () {
    try {
      await this.poll()
    } finally {
      this.timer = setTimeout(
        () => this.startPolling(),
        this.options.interval * 1000
      )
    }
  }
}
