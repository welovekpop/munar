const mongoose = require('mongoose')

const { Schema } = mongoose
const { ObjectId } = Schema.Types

export const User = mongoose.model('User', {
  _id: Number
, username: String
, slug: String
, level: Number
, role: Number
, gRole: Number
, joined: Date
, avatar: String
, badge: String
, lastVisit: Date
, visits: { type: Number, default: 1 }
, karma: { type: Number, default: 1 }
})

const mediaSchema = new Schema({
  author: String
, title: String
, image: String
, duration: Number
, format: Number
, cid: String
})

mediaSchema.virtual('fullTitle').get(function () { return `${this.author} – ${this.title}` })

export const Media = mongoose.model('Media', mediaSchema)

export const HistoryEntry = mongoose.model('HistoryEntry', {
  _id: String
, media: { type: ObjectId, ref: 'Media' }
, dj: { type: Number, ref: 'User' }
, time: { type: Date, default: Date.now }
, score:
  { positive: Number
  , negative: Number
  , grabs: Number
  , listeners: Number }
})