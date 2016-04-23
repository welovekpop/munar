import Plugged from 'plugged'
import last from 'lodash.last'

const commandsSym = Symbol('commands')

const ROLE = Plugged.prototype.USERROLE

const defaults = {
  role: ROLE.NONE
}

export {
  ROLE,
  defaults,
  commandsSym as symbol
}

Object.assign(command, { ROLE, defaults, symbol: commandsSym })

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
