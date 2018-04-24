import { Message } from 'munar-core'

export default class PlugdjMessage extends Message {
  constructor (source, message, user) {
    super(source, message.message, message)

    this.user = user
  }

  get username () {
    return this.user.username
  }

  delete () {
    return this.source.deleteMessage(this.sourceMessage.id)
  }
}
