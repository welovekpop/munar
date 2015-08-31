const mongoose = require('mongoose')

const ChatMessage = mongoose.model('ChatMessage', {
  _id: String, // chat id
  type: String,
  user: { type: Number, ref: 'User', index: true },
  message: String,
  time: { type: Date, default: Date.now, index: true },
  emoji: [ String ],
  mentions: [ { type: Number, ref: 'User' } ]
})

export default ChatMessage
