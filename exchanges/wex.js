const Base = require('../base')
const BtceService = require('btc-e-v3')
const Pusher = require('pusher-js')

class Wex extends Base {
  constructor(option) {
    super(option)

    // Инициализация соединения
    this.query = new BtceService({
      publicKey: this.api.key,
      secretKey: this.api.secret
    })

    this.socket = new Pusher('ee987526a24ba107824c', { cluster: 'eu' })
    this.channel = this.socket.subscribe(`${this.pair}.trades`)
  }

  // Формирование структурированных данных купли/продажи
  async firstLoadTrades() {
    try {
      const trades = await this.query.trades(this.pair, 5000)
      for (let item of trades[this.pair].reverse()) {
        await this.addElementCandles([item.type, item.price, item.amount], item.timestamp * 1000, false)
      }
    } catch (e) {
      console.log('Error firstLoadTrades:', e.error)
    }
  }

  // Формирование структурированных данных в реальном времени
  async trades() {
    try {
      // Первая запуск загружает большой список данных
      await this.firstLoadTrades()

      // От сервиса Pusher получаем данные транзакций в реальном времени
      this.channel.bind('trades', async item => await this.addElementCandles(item[0]))
    } catch (e) {
      console.log('Error trades:', e.error)
    }
  }

  // Загружаем список активных оредров
  async activeOrders() {
    const orders = await this.query.activeOrders(this.pair)
    return orders
  }

  // Последняя транзакция
  async lastTransaction() {
    try {
      // Последняя транзакция
      const [order] = await this.query.tradeHistory({ from: 0, count: 1, pair: this.pair })

      // Добавляем методы для стандартизации разных бирж
      order.price = order.rate
      order.amount = order.start_amount
      return order
    } catch (e) {
      // Возвращаем информацию, что можно совершить покупку
      return { type: 'sell' }
    }
  }

  // Получить данные кошельков
  async getWallets() {
    try {
      const info = await this.query.getInfo()
      return info.funds
    } catch (e) {
      console.log('Error getWallets', e.error)
    }
  }

  // Создание ордера
  async trade(price, amount) {
    return await this.query.trade({
      pair: this.pair,
      type: this.task.type,
      rate: price,
      amount: amount
    })
  }

  // Информация об ордере
  async orderInfo(id) {
    const order = await this.query.orderInfo(id)
    
    // Добавляем методы для стандартизации разных бирж
    order.price = order.rate
    order.amount = order.start_amount
    order.timestamp = order.timestamp_created

    return order
  }

  // Отмена ордера
  async cancelOrder(id) {
    const removeOrder = await this.query.cancelOrder(id)
    return removeOrder
  }

  // История сделок
  getHistoryApi () {
    return this.query.tradeHistory({ count: 20, order: 'DESC' })
  }
}

module.exports = Wex