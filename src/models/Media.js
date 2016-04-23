import { Model } from 'mongoose-model-decorators'

@Model
export default class Media {
  static timestamps = true

  static schema = {
    author: String,
    title: String,
    image: String,
    duration: Number,
    format: Number,
    cid: { type: String, index: true }
  }

  get fullTitle () {
    return `${this.author} – ${this.title}`
  }
}
