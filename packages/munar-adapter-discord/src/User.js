import { User } from 'munar-core'

export default class DiscordUser extends User {
  constructor (discord, user) {
    super(discord, user.id, user.username, user)
  }

  mention () {
    return this.sourceUser.mention
  }
}
