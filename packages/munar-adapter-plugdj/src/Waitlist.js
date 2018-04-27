export default class Waitlist {
  constructor (plug) {
    this.plug = plug
  }

  get mp () {
    return this.plug.mp
  }

  async at (position) {
    const id = this.mp.waitlist()[position]
    return id ? this.mp.user(id) : null
  }

  async positionOf (user) {
    return this.mp.waitlist()
      .positionOf(user)
  }

  async all () {
    return this.mp.waitlist()
  }

  async move (user, position) {
    await this.mp.moveDJ(user, position)
  }
}
