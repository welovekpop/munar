import random from 'random-item'

/**
 * Username of the user who used the trigger.
 */
export function user ({ user }) {
  return user.username
}

/**
 * Username of the bot.
 */
export function bot ({ source }) {
  return source.getSelf().username
}

/**
 * Username of a random user.
 */
export function anyone ({ source }) {
  let anyone = random(source.getUsers())
  return anyone ? anyone.username : ''
}

/**
 * Username of the target of this trigger (eg. !slap @TargetUsername).
 *
 * $target{expression} -> Username of the target, or `expression` if no target
 * is given. (The expression can also contain variables.)
 */
export function target ({ source, user, args, params }) {
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
}

/**
 * URL-encode an expression.
 */
export function e ({ params }) {
  return encodeURIComponent(params[0])
}
