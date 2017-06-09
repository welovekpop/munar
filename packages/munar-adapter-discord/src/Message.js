import { Message } from 'munar-core'

export default class DiscordMessage extends Message {
  get user () {
    return this.source.getUser(this.sourceMessage.author.id)
  }

  get username () {
    return this.user.username
  }

  delete () {
    return this.sourceMessage.delete()
  }
}
