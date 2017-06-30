const db = require('./db')

// Список покупок
const OrderSchema = new db.mongoose.Schema({
  type: {type: String, required: [true, 'typeRequired']},
  pair: {type: String, required: [true, 'pairRequired']},
  rate: {type: String, required: [true, 'rateRequired']},
  amount: {type: String, required: [true, 'amountRequired']},
  date: {type: Date, default: Date.now}
})

exports.Order = db.connect.model('Order', OrderSchema)
