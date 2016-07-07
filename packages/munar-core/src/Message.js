export default class Message {
  constructor (source, text, sourceMessage) {
    this.source = source
    this.text = text
    this.sourceMessage = sourceMessage
  }

  reply (text, ...args) {
    this.source.reply(this, text, ...args)
  }

  send (text, ...args) {
    this.source.send(text, ...args)
  }

  toString () {
    return `${this.source} | <${this.username || this.user || 'Unknown'}> ${this.text}`
  }
}
