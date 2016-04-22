import assign from 'object-assign'
import Plugged from 'plugged'

const commandsSym = Symbol('commands')

const ROLE = Plugged.prototype.USERROLE

const defaults = {
  role: ROLE.NONE
}

const last = arr => arr[arr.length - 1]

export {
  ROLE,
  defaults,
  commandsSym as symbol
}

Object.assign(command, { ROLE, defaults, symbol: commandsSym })

export default function command(...names) {
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
