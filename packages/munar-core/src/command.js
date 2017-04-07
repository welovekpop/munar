import last from 'lodash.last'
import getParameterNames from '@captemulation/get-parameter-names'
import * as permissions from './permissions'
import argumentParser from './argumentParser'

const commandsSym = Symbol('commands')

const defaults = {
  role: permissions.NONE,
  arguments: []
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
command.arg = argumentParser

export default function command (...names) {
  let opts = typeof last(names) === 'object' ? names.pop() : {}

  return function (target, method, descriptor) {
    target[commandsSym] || (target[commandsSym] = [])

    const options = {
      ...defaults,
      ...opts,
      names,
      method
    }

    // Auto-apply labels to argument parameters, if none are given, based on
    // the method's argument names.
    const fn = method ? target[method] : null
    if (fn) {
      const paramNames = getParameterNames(fn).slice(1)
      options.arguments = paramNames.map((paramName, i) => {
        let argument = options.arguments[i]
        // Add dummy argument 'validators' if there are none, so we can still
        // attach metadata about the function parameters.
        if (!argument) {
          argument = command.arg.any()
        }

        // Don't know what to do with this!
        if (!argument.isJoi) {
          return
        }

        argument = argument.meta({ parameter: paramName })
        if (!argument._flags.label) {
          argument = argument.label(paramName)
        }

        return argument
      })
    }

    target[commandsSym].push(options)
  }
}
