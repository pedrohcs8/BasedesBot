const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  username: String,
  userId: Number,
  serverPort: Number,
  serverCreated: Boolean,
  allowed: Boolean
})

module.exports = mongoose.model('users', UserSchema)
