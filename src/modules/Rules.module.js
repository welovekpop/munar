const SekshiModule = require('../Module')
const find = require('array-find')

export default class Rules extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Adds a !rule command that tells people specific rules from the room description.'

    this.permissions = {
      rule: sekshi.USERROLE.NONE
    }
  }

  defaultOptions() {
    return {
      url: 'https://my-room-website.com/rules'
    }
  }

  rule(user, n, targetName = null) {
    const descr = this.sekshi.getDescription()
    const rx = new RegExp(`^${n}. `)
    const rule = find(descr.split('\n'), line => rx.test(line))

    if (!rule) {
      this.sekshi.sendChat(`@${user.username} I don't know that rule…`)
      return
    }

    let targetPing = ''
    if (targetName) {
      const target = this.sekshi.getUserByName(targetName)
      targetPing = target ? `@${target.username}` : targetName
    }
    this.sekshi.sendChat(`${targetPing} ${rule} ${this.options.url}`)
  }

}