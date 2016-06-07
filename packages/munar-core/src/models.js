import { Schema } from 'mongoose'
import { Plugin } from 'mongoose-model-decorators'
import random from 'mongoose-random'

const { ObjectId } = Schema.Types

@Plugin(random, { path: '__r' })
export class UserModel {
  static timestamps = true

  static schema = {
    sourceId: { type: String, index: true },
    adapter: { type: String, index: true },
    username: { type: String, index: true },
    permissions: {},
    sourceData: {}
  }

  static ref (opts = {}) {
    return { type: ObjectId, ref: 'User', ...opts }
  }

  static from (user) {
    if (!user || !user.source) {
      return Promise.resolve(null)
    }
    return this.findOne(user.compoundId())
  }
}

export class ChatMessageModel {
  static timestamps = true

  static schema = {
    type: String,
    user: UserModel.ref({ index: true }),
    message: String,
    emoji: [ String ],
    mentions: [ UserModel.ref() ]
  }

  static ref (opts = {}) {
    return { type: ObjectId, ref: 'ChatMessage', ...opts }
  }

  delete () {
    this.source.deleteMessage(this)
  }
}
