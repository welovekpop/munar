import * as permissions from './permissions'
import last from 'lodash.last'

const commandsSym = Symbol('commands')

const defaults = {
  role: permissions.NONE
}

const ROLE = {
  NONE: permissions.NONE,
  RESIDENTDJ: permissions.REGULAR,
  BOUNCER: permissions.MODERATOR,
  MANAGER: permissions.MODERATOR,
  COHOST: permissions.ADMIN,
  HOST: permissions.ADMIN
}

export {
  ROLE,
  defaults,
  commandsSym as symbol
}

command.ROLE = ROLE
command.defaults = defaults
command.symbol = commandsSym

export default function command (...names) {
  let opts = typeof last(names) === 'object' ? names.pop() : {}

  return function (target, method, descriptor) {
    target[commandsSym] || (target[commandsSym] = [])
    let com = {
      ...defaults,
      ...opts,
      names,
      method
    }
    target[commandsSym].push(com)
  }
}
