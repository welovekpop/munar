const assign = require('object-assign')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  _id: Number
, username: { type: String, index: true }
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

  // slugs don't exist on some user objects, but plugged still adds the
  // property. delete it to prevent overwriting existing slugs with nothing.
  if (!descr.slug) delete descr.slug

  return User.findById(plugUser.id).exec().then(doc => {
    if (!doc) return new User(assign(descr, { _id: plugUser.id })).save()
    else      return doc.set(descr).save()
  })
})

const User = mongoose.model('User', userSchema)

export default User
