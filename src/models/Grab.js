import { Model } from 'mongoose-model-decorators'

@Model
export default class Grab {
  static timestamps = true

  static schema = {
    user: { type: Number, ref: 'User' },
    history: { type: String, ref: 'HistoryEntry', index: true }
  }
}
