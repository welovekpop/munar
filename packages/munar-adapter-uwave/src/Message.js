import { Message } from 'munar-core'

export default class UwaveMessage extends Message {
  constructor (source, message, user) {
    super(source, message.message, message)

    this.user = user
  }

  get username () {
    return this.user && this.user.username
  }

  delete () {
    this.source.deleteMessage(this.sourceMessage.id)
  }
}
