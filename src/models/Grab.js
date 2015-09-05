const mongoose = require('mongoose')

const Grab = mongoose.model('Grab', {
  user: { type: Number, ref: 'User' }
, history: { type: String, ref: 'HistoryEntry', index: true }
, time: { type: Date, default: Date.now }
})

export default Grab
