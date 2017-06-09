import rename from 'rename-prop'

function normalizeEmbed (embed) {
  if (embed.text) {
    rename(embed, 'text', 'description')
  }
  if (embed.fallback) {
    delete embed.fallback
  }
  return embed
}

function normalizeMessageOptions (options) {
  options = { ...options }

  if (options.attachments) {
    options.embed = normalizeEmbed(options.attachments[0])
    delete options.attachments
  }

  return options
}

export default class DiscordChannel {
  constructor (discord, channel) {
    this.discord = discord
    this.client = discord.client
    this.channel = channel
  }

  getUsers () {
    return this.discord.getUsers()
  }
  getUser (id) {
    return this.discord.getUser(id)
  }
  getUserByName (name) {
    return this.discord.getUserByName(name)
  }

  getChannels () {
    return this.discord.getChannels()
  }
  getChannel (id) {
    return this.discord.getChannel(id)
  }
  getChannelByName (name) {
    return this.discord.getChannelByName(name)
  }

  reply (message, text, opts = undefined) {
    this.send(`${message.user.mention()} ${text}`, opts)
  }

  send (text, opts = undefined) {
    opts = normalizeMessageOptions(opts || {})
    opts.content = text
    this.client.createMessage(this.channel.id, opts)
  }

  getAdapterName () {
    return this.discord.getAdapterName()
  }

  canExecute () {
    return true
  }

  toString () {
    return `discord:${this.channel.name}`
  }
}
