import { Message } from 'munar-core'

export default class UwaveMessage extends Message {
  constructor (source, message, user) {
    super(source, message.message, message)

    this.user = user
  }

  get username () {
    return this.user && this.user.username
  }

  get id () {
    return `${this.sourceMessage._id}-${this.sourceMessage.timestamp}`
  }

  delete () {
    this.source.deleteMessage(this.id)
  }
}
