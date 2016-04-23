import User from '../../User'

export default class SlackUser extends User {
  constructor (slack, user) {
    super(slack, user.id, user.name, user)
  }
}
