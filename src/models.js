const mongoose = require('mongoose')
const assign = require('object-assign')

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const userSchema = new Schema({
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

userSchema.static('fromPlugUser', function (plugUser) {
  const descr = {
    username: plugUser.username
  , slug: plugUser.slug
  , level: plugUser.level
  , role: plugUser.role
  , gRole: plugUser.gRole
  , joined: new Date(plugUser.joined)
  , avatar: plugUser.avatarID
  , badge: plugUser.badge
  }

  return User.findById(plugUser.id).exec().then(doc => {
    if (!doc) return User.create(assign(descr, { _id: plugUser.id }))
    else      return doc.set(descr).save()
  })
})

export const User = mongoose.model('User', userSchema)

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

const karmaSchema = new Schema({
  date: { type: Date, default: Date.now }
, target: { type: Number, ref: 'User' }
, reason: String
, amount: { type: Number, default: 1 }
, giver: { type: Number, ref: 'User' }
})

export const Karma = mongoose.model('Karma', karmaSchema)

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

export const Vote = mongoose.model('Vote', {
  direction: Number
, user: { type: Number, ref: 'User' }
, history: { type: String, ref: 'HistoryEntry' }
, time: { type: Date, default: Date.now }
})
