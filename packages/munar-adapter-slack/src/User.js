import { User } from 'munar-core'

export default class SlackUser extends User {
  constructor (slack, user) {
    super(slack, user.id, user.name, user)
  }
}
