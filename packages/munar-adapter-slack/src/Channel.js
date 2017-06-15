import { permissions } from 'munar-core'
import { linkNames } from './utils'
import rename from 'rename-prop'

const defaultMessageOptions = {
  as_user: true
}

function normalizeMessageOptions (options) {
  if (options.titleLink) {
    rename(options, 'titleLink', 'title_link')
  }

  return options
}

export default class SlackChannel {
  constructor (slack, channel) {
    this.slack = slack
    this.client = slack.client
    this.webClient = slack.webClient
    this.channel = channel
  }

  getUsers () {
    return this.slack.getUsers()
  }
  getUser (id) {
    return this.slack.getUser(id)
  }
  getUserByName (name) {
    return this.slack.getUserByName(name)
  }

  getChannels () {
    return this.slack.getChannels()
  }
  getChannel (id) {
    return this.slack.getChannel(id)
  }
  getChannelByName (name) {
    return this.slack.getChannelByName(name)
  }

  reply (message, text, opts = undefined) {
    this.send(`@${message.username} ${text}`, opts)
  }

  send (text, opts = undefined) {
    if (typeof opts === 'object' && Object.keys(opts).length > 0) {
      const chatClient = this.slack.web.chat
      chatClient.postMessage(
        this.channel.id,
        linkNames(this.slack, text),
        normalizeMessageOptions({
          ...defaultMessageOptions,
          ...opts
        })
      )
    } else {
      this.client.sendMessage(linkNames(this.slack, text), this.channel.id)
    }
  }

  canExecute (message, command) {
    const user = message.user.sourceUser
    if (user.is_admin) {
      return true
    }
    return command.role <= permissions.NONE
  }

  getAdapterName () {
    return this.slack.getAdapterName()
  }

  toString () {
    return `slack:${this.channel.name}`
  }
}
