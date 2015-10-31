import assign from 'object-assign'

export default class Message {
  constructor(source, text, sourceMessage) {
    this.source = source
    this.text = text
    this.sourceMessage = sourceMessage
  }

  reply(text) {
    this.source.reply(this, text)
  }

  send(text) {
    this.source.send(text)
  }
}
