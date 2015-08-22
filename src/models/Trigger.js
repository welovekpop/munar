const mongoose = require('mongoose')

const Trigger = mongoose.model('Trigger', {
  _id: String,
  response: String,
  user: { type: Number, ref: 'User' },
  added: { type: Date, default: Date.now }
})

export default Trigger
