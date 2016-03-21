import { Schema } from 'mongoose'
import { Model } from 'mongoose-model-decorators'

const Types = Schema.Types

@Model
export default class Trigger {
  static timestamps = true

  static schema = {
    _id: String,
    response: String,
    user: { type: Types.ObjectId, ref: 'User' }
  }
}
