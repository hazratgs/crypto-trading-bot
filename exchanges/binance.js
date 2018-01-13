const Base = require('../base')
const api = require('binance')

class Binance extends Base {
	constructor(option) {
		super(option)

		// Инициализация соединения
		this.query = new api.BinanceRest({
			key: this.api.key,
			secret: this.api.secret
		})

		// WS
		this.ws = new api.BinanceWS(true)
	}

	// Формирование структурированных данных купли/продажи
	async firstLoadTrades() {
		try {
			const trades = await this.query.trades(this.pair)
			for (let item of trades) {
				await this.addElementCandles([item.isBuyerMaker ? 'buy' : 'sell', item.price, item.qty], item.time, false)
			}
		} catch (e) {
			console.log('Error firstLoadTrades:', e)
		}
	}

	// Формирование структурированных данных в реальном времени
	async trades() {
		try {
			// Первая запуск загружает большой список данных
			await this.firstLoadTrades()
			this.ws.onTrade(
				this.pair,
				async item => await this.addElementCandles([item.maker ? 'sell' : 'buy', item.price, item.quantity])
			)
		} catch (e) {
			console.log('Error trades:', e.error)
		}
	}

	// Загружаем список активных оредров
	async activeOrders() {
		const orders = await this.query.openOrders({ symbol: this.pair })
		if (!orders.length) throw new Error('no orders')

		return orders.reduce((prev, current) => {
			prev[current.orderId] = current
			return prev
		}, {})
	}

	// Последняя транзакция
	async lastTransaction() {
		try {
			// Последняя транзакция
			const [order] = await this.query.allOrders({ symbol: this.pair, limit: 1 })
				
			// Добавляем методы для стандартизации разных бирж
			return this.changeOrder(order)
		} catch (e) {
			// Возвращаем информацию, что можно совершить покупку
			return { type: 'sell' }
		}
	}

	// Получить данные кошельков
	async getWallets() {
		try {
			const info = await this.query.account()
			const data = info.balances.reduce((prev, current) => {
				prev[current.asset] = parseFloat(current.free)
				return prev
			}, {})
			return data
		} catch (e) {
			console.log('Error getWallets', e)
		}
	}

	// Создание ордера
	async trade(price, amount) {
		return await this.query.newOrder({
			symbol: this.pair,
			side: this.task.type,
			type: 'limit',
			price: price,
			timeInForce: 'gtc',
			quantity: amount,
			timestamp: Date.now()
		})
	}

	// Информация об ордере
	async orderInfo(id) {
		const order = await this.query.queryOrder({ symbol: this.pair, orderId: id })

		// Добавляем методы для стандартизации разных бирж
		return this.changeOrder(order)
	}

	// История сделок
	getHistoryApi() {
		return this.query.allOrders({ symbol: this.pair, limit: 20 })
	}

	// Отмена ордера
	async cancelOrder(id) {
		const removeOrder = await this.query.cancelOrder({ symbol: this.pair, orderId: id })
		return removeOrder
	}

	// Приводим к 1 стандарту order
	changeOrder (order) {
		switch (order.status) {
			case 'NEW':
				order.status = 0
				break

			case 'FILLED':
				order.status = 1
				break

			case 'CANCELED':
				order.status = 2
				break

			case 'PARTIALLY_FILLED':
				order.status = 3
				break

			default:
				order.status = 2
				break
		}
		
		order.price = parseFloat(order.price)
		order.amount = parseFloat(order.origQty)
		order.type = order.side
		order.start_amount = order.executedQty
		order.timestamp = order.time

		return order
	}
}

module.exports = Binance