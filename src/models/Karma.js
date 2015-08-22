const mongoose = require('mongoose')
const Schema = mongoose.Schema

const karmaSchema = new Schema({
  date: { type: Date, default: Date.now }
, target: { type: Number, ref: 'User' }
, reason: String
, amount: { type: Number, default: 1 }
, giver: { type: Number, ref: 'User' }
})

const Karma = mongoose.model('Karma', karmaSchema)

export default Karma
