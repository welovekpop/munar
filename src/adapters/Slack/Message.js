import SlackUser from './User'
import Message from '../../Message'

export default class SlackMessage extends Message {
  constructor(slack, ...args) {
    super(...args)
    this.slack = slack
  }

  get user() {
    return this.slack.getUser(this.sourceMessage.user)
  }

  get username() {
    return this.user.username
  }

  delete() {
    this.sourceMessage.deleteMessage()
  }
}
