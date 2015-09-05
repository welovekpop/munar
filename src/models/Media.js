const mongoose = require('mongoose')
const Schema = mongoose.Schema

const mediaSchema = new Schema({
  author: String
, title: String
, image: String
, duration: Number
, format: Number
, cid: { type: String, index: true }
})

mediaSchema.virtual('fullTitle').get(function () { return `${this.author} – ${this.title}` })

const Media = mongoose.model('Media', mediaSchema)

export default Media
