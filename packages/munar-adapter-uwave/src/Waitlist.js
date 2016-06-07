const waitlistEvents = [
  'waitlistJoin',
  'waitlistLeave',
  'waitlistMove',
  'waitlistAdd',
  'waitlistRemove'
]

export default class Waitlist {
  waitlist = []

  constructor (uw) {
    this.uw = uw

    uw.socketEvents.on('waitlistUpdate', (waitlist) => {
      this.waitlist = waitlist
    })
    uw.socketEvents.on('waitlistClear', () => {
      this.waitlist = []
    })

    for (const event of waitlistEvents) {
      uw.socketEvents.on(event, ({ waitlist }) => {
        this.waitlist = waitlist
      })
    }
  }

  async at (position) {
    const id = this.waitlist[position]
    return id ? this.uw.getUser(id) : null
  }

  async positionOf (user) {
    if (typeof user === 'object') user = user.id
    return this.waitlist.indexOf(user)
  }

  async all () {
    return this.waitlist
      .map((id) => this.uw.getUser(id))
      .filter(Boolean)
  }

  async move (user, position) {
    if (typeof user === 'object') user = user.id
    await this.uw.request('put', 'waitlist/move', {
      userID: user,
      position
    })
  }
}
