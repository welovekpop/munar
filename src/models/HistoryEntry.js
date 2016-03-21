import { Schema } from 'mongoose'
import { Model } from 'mongoose-model-decorators'

const Types = Schema.Types

@Model
export default class HistoryEntry {
  static timestamps = true

  static schema = {
    _id: String,
    media: { type: Types.ObjectId, ref: 'Media', index: true },
    dj: { type: Number, ref: 'User', index: true },
    score: {
      positive: Number,
      negative: Number,
      grabs: Number,
      listeners: Number,
      skipped: Number
    },
    skip: {
      kind: String,
      reason: String,
      time: Date,
      user: { type: Number, ref: 'User' }
    }
  }
}
