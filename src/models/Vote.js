const mongoose = require('mongoose')

const Vote = mongoose.model('Vote', {
  direction: Number
, user: { type: Number, ref: 'User' }
, history: { type: String, ref: 'HistoryEntry', index: true }
, time: { type: Date, default: Date.now }
})

export default Vote
