const mongoose = require('mongoose')
const Schema = mongoose.Schema

const karmaSchema = new Schema({
  date: { type: Date, default: Date.now, index: true }
, target: { type: Number, ref: 'User', index: true }
, reason: String
, amount: { type: Number, default: 1 }
, giver: { type: Number, ref: 'User', index: true }
})

const Karma = mongoose.model('Karma', karmaSchema)

export default Karma
