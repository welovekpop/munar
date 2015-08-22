const mongoose = require('mongoose')

const Grab = mongoose.model('Grab', {
  user: { type: Number, ref: 'User' }
, history: { type: String, ref: 'HistoryEntry' }
, time: { type: Date, default: Date.now }
})

export default Grab
