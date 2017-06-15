import { Plugin, command, permissions } from 'munar-core'
import last from 'lodash.last'
import { TriggerModel } from './models'
import * as vars from './vars'
import { renderTriggers } from './serve'

export default class Triggers extends Plugin {
  static description = 'Throws text at people.'

  constructor (bot, options) {
    super(bot, options)

    this.models({
      Trigger: TriggerModel
    })
  }

  async enable () {
    const triggers = await this.model('Trigger').find()
    triggers.forEach((link) => {
      this.add(link._id, link.response)
    })
  }

  add (name, response) {
    this.addCommand(name, (message, ...params) => {
      message.send(this.run(response, message, ...params))
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
          bot: this.bot,
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

  @command('addtrigger', 'trigger', {
    role: permissions.MODERATOR,
    description: 'Define a new trigger.',
    arguments: [
      command.arg.string()
        .regex(/^.\w+$/)
        .description('The name of the trigger.')
    ]
  })
  async createTrigger (message, name, ...response) {
    const Trigger = this.model('Trigger')
    const User = this.model('User')
    name = name.toLowerCase()
    response = response.join(' ')
    if (name[0] === this.bot.options.trigger) {
      name = name.slice(1)
    }
    let trig = new Trigger({
      _id: name,
      response: response,
      user: await User.from(message.user)
    })

    await trig.save()
    message.reply(`Created trigger "!${name}"`)
    this.add(name, response)
  }

  @command('deltrigger', {
    role: command.ROLE.BOUNCER,
    description: 'Delete a trigger.',
    arguments: [
      command.arg.string()
        .regex(/^.\w+$/)
        .description('The name of the trigger.')
    ]
  })
  async removeTrigger (message, name) {
    const Trigger = this.model('Trigger')
    name = name.toLowerCase()
    if (name[0] === this.bot.options.trigger) {
      name = name.slice(1)
    }
    await Trigger.remove({ _id: name })
    this.removeCommand(name)
    message.reply(`Removed trigger "!${name}"`)
  }

  async serve () {
    const Trigger = this.model('Trigger')

    const triggers = await Trigger.find()
      .sort({ _id: 1 })
      .lean()

    return renderTriggers({
      triggers,
      triggerCharacter: this.bot.options.trigger
    })
  }
}
