import { Module, command } from '../'
import Trigger from '../models/Trigger'
import random from 'random-item'
import last from 'lodash.last'

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
  user ({ user }) { return user.username },
  dj () {
    const source = this.getAdapter('uwave')
    return source.getCurrentDJ().username
  },
  bot ({ source }) {
    return source.getBotUser().username
  },
  artist () {
    const source = this.getAdapter('uwave')
    return source.getCurrentMedia().artist
  },
  title () {
    const source = this.getAdapter('uwave')
    return source.getCurrentMedia().title
  },
  song () {
    const source = this.getAdapter('uwave')
    let media = source.getCurrentMedia()
    return `${media.author} – ${media.title}`
  },
  anyone ({ source }) {
    let anyone = random(source.getUsers())
    return anyone ? anyone.username : ''
  },
  target ({ source, user, args, params }) {
    const targetName = args.join(' ')
    const defaultTarget = params.length > 0 ? params[0] : null
    const target = source.getUserByName(targetName)
    if (target) {
      return target.username
    }
    if (targetName) {
      return targetName
    }
    if (defaultTarget) {
      return defaultTarget
    }
    return user.username
  },

  e ({ params }) {
    return encodeURIComponent(params[0])
  }
}

export default class Triggers extends Module {
  author = 'ReAnna'
  description = 'Throws text at people.'

  init () {
    Trigger.find().exec().each((link) => {
      this.add(link._id, link.response)
    })
  }

  add (name, response) {
    this.addCommand(name, (message, ...params) => {
      message.reply(this.run(response, message, ...params))
    })
  }

  // Parses a response string with $variables.
  run (str, message, ...args) {
    const stringifyList = (tokens) => tokens.map(stringify).join('')
    const stringifyBack = (token) => {
      return `$${token.name}` + token.params
        .map(stringifyList)
        .map((str) => `{${str}}`)
        .join('')
    }
    const stringify = (token) => {
      if (token.type === 'raw') return token.value
      const fn = vars[token.name]
      if (fn) {
        return fn.call(this.bot, {
          message,
          args,
          user: message.user,
          source: message.source,
          params: token.params.map(stringifyList)
        })
      }
      return stringifyBack(token)
    }
    let tokens = this.parse(str)
    return stringifyList(tokens)
  }

  parse (str) {
    let tokens = []
    let lastToken = {}
    let stack = [ tokens ]
    let depth = 0
    let i = 0
    let chunk
    while ((chunk = str.slice(i))) {
      if (chunk[0] === '{' && last(tokens).type === 'var') {
        let param = []
        let params = last(tokens).params
        params.push(param)
        stack.push(tokens = param)
        depth++
        i++
      } else if (chunk[0] === '}' && depth > 0) {
        stack.pop()
        tokens = last(stack)
        depth--
        i++
      } else if (chunk[0] === '$') {
        const match = /^\$(\w+)\b/.exec(chunk)
        if (match) {
          tokens.push(lastToken = { type: 'var', name: match[1], params: [] })
          i += match[0].length
        } else {
          tokens.push(lastToken = { type: 'raw', value: chunk[0] })
          i++
        }
      } else {
        const end$ = chunk.indexOf('$', 1)
        const endO = chunk.indexOf('{', 1)
        const endC = depth > 0 ? chunk.indexOf('}', 1) : -1
        const end = Math.min(...[end$, endO, endC].filter((i) => i !== -1))
        lastToken = { type: 'raw', value: chunk.slice(0, end) }
        tokens.push(lastToken)
        i += end
      }
    }
    return tokens
  }

  @command('trigger', { role: command.ROLE.BOUNCER })
  async createTrigger (message, name, ...response) {
    name = name.toLowerCase()
    response = response.join(' ')
    if (name[0] === this.bot.trigger) {
      name = name.slice(1)
    }
    let trig = new Trigger({
      _id: name,
      response: response,
      user: message.user.id
    })

    await trig.save()
    message.reply(`Created trigger "!${name}"`)
    this.add(name, response)
  }

  @command('deltrigger', { role: command.ROLE.BOUNCER })
  async removeTrigger (message, name) {
    name = name.toLowerCase()
    if (name[0] === this.bot.trigger) {
      name = name.slice(1)
    }
    await Trigger.remove({ _id: name })
    this.removeCommand(name)
    message.reply(`Removed trigger "!${name}"`)
  }
}
