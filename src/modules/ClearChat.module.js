const SekshiModule = require('../Module')

const LINK_RX = /https?:\/\/(\S{4,})/i

export default class ClearChat extends SekshiModule {

  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Provides a !clearchat command to clean up spam.'

    this.permissions = {
      clearchat: sekshi.USERROLE.BOUNCER
    }
  }

  init() {
    this.sekshi.cacheChat(true)
    // size of the default chat history in plug's UI
    this.sekshi.setChatCacheSize(512)
  }

  _delete(filter) {
    this.sekshi.getChat()
      .filter(filter)
      .reverse() // delete recent messages first
      .forEach(msg => this.sekshi.removeChatMessage(msg.cid))
  }

  clearchat(user, ...types) {
    if (types.length === 0) {
      types = [ 'all' ]
    }
    if (types.indexOf('all') !== -1) {
      this._delete(msg => true)
      this.sekshi.sendChat(`@${user.username} Clearing chat!`)
      return
    }

    let deletedLinks = false
    let deletedUsers = []

    types.forEach(type => {
      if (type === 'link' || type === 'links') {
        this._delete(msg => LINK_RX.test(msg.message))
        deletedLinks = true
      }
      else if (type) {
        if (type.charAt(0) === '@') type = type.slice(1)
        let username = type.toLowerCase()
        this._delete(msg => msg.username.toLowerCase() === username)
        // get proper capitalisation for users who are in the room
        let user = this.sekshi.getUserByName(type)
        deletedUsers.push(user ? user.username : type)
      }
    })

    let dels = ''
    if (deletedLinks) {
      dels += `links ${deletedUsers.length ? 'and ' : ''}`
    }
    if (deletedUsers.length > 0) {
      dels += `messages by ${deletedUsers.join(', ')} `
    }
    this.sekshi.sendChat(`@${user.username} Deleting ${dels} from chat!`)
  }

}
