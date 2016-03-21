import { Model } from 'mongoose-model-decorators'

@Model
export default class Karma {
  static timestamps = true

  static schema = {
    date: { type: Date, default: Date.now, index: true },
    target: { type: Number, ref: 'User', index: true },
    giver: { type: Number, ref: 'User', index: true },
    amount: { type: Number, default: 1 },
    reason: String
  }
}
