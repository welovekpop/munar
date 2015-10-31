const debug = require('debug')('sekshi:triggers')
const SekshiModule = require('../Module')
const command = require('../command')
const Trigger = require('../models/Trigger')
const random = require('random-item')
const last = require('lodash.last')

// Available variables:
//  * $user -> Username of the user who used the trigger
//  * $dj -> Username of the current DJ
//  * $bot -> Username of the bot
//  * $artist -> Artist of the current media
//  * $title -> Title of the current media
//  * $song -> Artist - Title of the current media
//  * $anyone -> Username of a random user
//  * $target -> Username of the target of this trigger (eg. !slap @TargetUsername)
//  * $target{expression} -> Username of the target, or `expression` if no target is given.
//                           (The expression can also contain variables.)
//  * $e{expression} -> URL-encoded version of `expression`.
const vars = {
  user({ user }) { return user.username },
  dj() { return this.getCurrentDJ().username },
  bot() { return this.getSelf().username },
  artist() { return this.getCurrentMedia().author },
  title() { return this.getCurrentMedia().title },
  song() {
    let media = this.getCurrentMedia()
    return `${media.author} – ${media.title}`
  },
  anyone() {
    let anyone = random(this.getUsers())
    return anyone ? anyone.username : ''
  },
  target({ user, args, params }) {
    let targetName = args.join(' ')
    let defaultTarget = params.length > 0 ? params[0] : null
    let target = this.getUserByName(targetName)
    return target ? target.username
         : targetName ? targetName
         : defaultTarget ? defaultTarget
         : user.username
  },

  e({ params }) {
    return encodeURIComponent(params[0])
  }
}

export default class Triggers extends SekshiModule {
  constructor(sekshi, options) {
    super(sekshi, options)

    this.author = 'ReAnna'
    this.description = 'Throws text at people.'
  }

  init() {
    Trigger.find().exec().each(link => {
      this.add(link._id, link.response)
    })
  }

  add(name, response) {
    this.addCommand(name, (message, ...params) => {
      message.reply(this.run(response, message.user, ...params))
    })
  }

  // Parses a response string with $variables.
  run(str, user, ...args) {
    const stringifyList = tokens => tokens.map(stringify).join('')
    const stringifyBack = token => {
      return `$${token.name}` + token.params.map(stringifyList).map(str => `{${str}}`).join('')
    }
    const stringify = token => {
      if (token.type === 'raw') return token.value
      let fn = vars[token.name]
      if (fn) {
        return fn.call(this.sekshi, { user, args, params: token.params.map(stringifyList) })
      }
      return stringifyBack(token)
    }
    let tokens = this.parse(str)
    return stringifyList(tokens)
  }

  parse(str) {
    let tokens = []
    let lastToken = {}
    let stack = [ tokens ]
    let depth = 0
    let i = 0
    let chunk
    while (chunk = str.slice(i)) {
      if (chunk[0] === '{' && last(tokens).type === 'var') {
        let param = []
        let params = last(tokens).params
        params.push(param)
        stack.push(tokens = param)
        depth++
        i++
      }
      else if (chunk[0] === '}' && depth > 0) {
        stack.pop()
        tokens = last(stack)
        depth--
        i++
      }
      else if (chunk[0] === '$') {
        let match = /^\$(\w+)\b/.exec(chunk)
        if (match) {
          tokens.push(lastToken = { type: 'var', name: match[1], params: [] })
          i += match[0].length
        }
        else {
          tokens.push(lastToken = { type: 'raw', value: chunk[0] })
          i++
        }
      }
      else {
        let end$ = chunk.indexOf('$', 1)
        let endO = chunk.indexOf('{', 1)
        let endC = depth > 0 ? chunk.indexOf('}', 1) : -1
        let end = Math.min(...[ end$, endO, endC ].filter(i => i > 0))
        tokens.push(lastToken = { type: 'raw', value: chunk.slice(0, end) })
        i += end
      }
    }
    return tokens
  }

  @command('trigger', { role: command.ROLE.BOUNCER })
  createTrigger(message, name, ...response) {
    name = name.toLowerCase()
    response = response.join(' ')
    if (name[0] === this.sekshi.delimiter) {
      name = name.slice(1)
    }
    let trig = new Trigger({
      _id: name,
      response: response,
      user: message.user.id
    })
    trig.save()
      .then(() => {
        message.reply(`Created trigger "!${name}"`)
        this.add(name, response)
      })
      .catch(e => {
        console.error(e.stack || e.message)
        message.reply(`Could not add trigger...`)
      })
  }

  @command('deltrigger', { role: command.ROLE.BOUNCER })
  removeTrigger(message, name) {
    name = name.toLowerCase()
    if (name[0] === this.sekshi.delimiter) {
      name = name.slice(1)
    }
    Trigger.remove({ _id: name }).then(removed => {
      this.removeCommand(name)
      message.reply(`Removed trigger "!${name}"`)
    })
  }
}
