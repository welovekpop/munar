import { Model } from 'mongoose-model-decorators'

@Model
export default class Vote {
  static timestamps = true

  static schema = {
    direction: Number,
    user: { type: Number, ref: 'User' },
    history: { type: String, ref: 'HistoryEntry', index: true }
  }
}
