const db = require('./db')

// Список покупок
const OrderSchema = new db.mongoose.Schema({
  id: {type: Number, required: [true, 'idRequired']},
  type: {type: String, required: [true, 'typeRequired']},
  pair: {type: String, required: [true, 'pairRequired']},
  rate: {type: String, required: [true, 'rateRequired']},
  amount: {type: String, required: [true, 'amountRequired']},
  status: {type: Boolean, default: false},
  date: {type: Date, default: Date.now}
})

exports.Order = db.connect.model('Order', OrderSchema)
