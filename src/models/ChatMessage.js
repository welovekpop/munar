import { Schema } from 'mongoose'
import { Model } from 'mongoose-model-decorators'

const Types = Schema.Types

@Model
export default class ChatMessage {
  static timestamps = true

  static schema = {
    type: String,
    user: { type: Types.ObjectId, ref: 'User', index: true },
    message: String,
    emoji: [ String ],
    mentions: [ { type: Types.ObjectId, ref: 'User' } ]
  }

  delete () {
    this.source.deleteMessage(this)
  }
}
