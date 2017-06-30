const mongoose = require('mongoose')
const config = require('../config')

mongoose.Promise = global.Promise
mongoose.connect(config.mongodb)

const db = mongoose.connection

db.on('error', err => {
  console.log().error('connection error:', err.message)
})

db.once('open', () => console.log("Connected to DB!"))

// MongoDB
exports.mongoose = mongoose;

// This DB
exports.connect = db;