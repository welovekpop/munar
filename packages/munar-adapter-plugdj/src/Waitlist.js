import promisify from 'pify'

export default class Waitlist {
  constructor (plug) {
    this.plug = plug
    this.internalMove = promisify(this.plugged.moveDJ)
  }

  get plugged () {
    return this.plug.plugged
  }

  get waitlist () {
    return this.plugged.getWaitlist()
  }

  async at (position) {
    const id = this.waitlist[position]
    return id ? this.plugged.getUserByID(id) : null
  }

  async positionOf (user) {
    if (typeof user === 'object') user = user.id
    return this.waitlist.indexOf(user)
  }

  async all () {
    return this.waitlist
      .map((id) => this.plugged.getUserByID(id))
      .filter(Boolean)
  }

  async move (user, position) {
    if (typeof user === 'object') user = user.id
    await this.internalMove(user, position)
  }
}
