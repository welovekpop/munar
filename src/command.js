const ROLE = require('plugged').prototype.USERROLE
const assign = require('object-assign')
const commandsSym = Symbol('commands')

const defaults = {
  role: ROLE.NONE
}

const last = arr => arr[arr.length - 1]

export default function command(...names) {

  let opts = typeof last(names) === 'object' ? names.pop() : {}

  return function (target, method, descriptor) {
    target[commandsSym] || (target[commandsSym] = [])
    let com = assign({}, defaults, opts, {
      names: names
    , method: method
    })
    target[commandsSym].push(com)
  }
}

assign(command, {
  ROLE: ROLE
, symbol: commandsSym
})
