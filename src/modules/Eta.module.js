import { Module, command } from '../'

export default class Eta extends Module {
  author = 'Sooyou'
  description = 'Provides an estimation of when people get to play their song.'

  @command('eta')
  eta (message) {
    const { user, source } = message
    if (user.id === source.getCurrentDJ().id) {
      return message.reply('Your turn is right now!')
    }
    const position = source.getWaitlist().findIndex((uid) => user.id === uid)
    if (position === 0) {
      message.reply('Your turn is next!')
    } else if (position === -1) {
      message.reply('You\'re not in the wait list!')
    } else {
      message.reply(`Your turn is in around ${position * 4} minutes!`)
    }
  }
}
