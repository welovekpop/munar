import { Model, Plugin } from 'mongoose-model-decorators'
import random from 'mongoose-random'

@Model
@Plugin(random, { path: '__r' })
export default class User {
  static timestamps = true

  static schema = {
    sourceId: { type: String, index: true },
    adapter: { type: String, index: true },
    username: { type: String, index: true },
    permissions: {}
  }
}
