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

	// Формирование структурированных данных в реальном времени
	async trades() {
		try {
			// Первая запуск загружает большой список данных
			await this.firstLoadTrades()
			this.ws.onTrade(this.pair, async item => await this.addElementCandles([item.maker ? 'sell' : 'buy', item.price, item.quantity]))
		} catch (e) {
			console.log('Error trades:', e.error)
		}
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

	// Данные кошелька
	async getBalance() {
		const wallets = await this.getWallets()
		const data = []
		for (let item in wallets) {
			data.push({ type: item, value: wallets[item] })
		}
		return data
	}

	// Загружаем список активных оредров
	async activeOrders() {
		const orders = await this.query.openOrders({ symbol: this.pair })
		if (!orders.length) throw new Error('Нет активных ордеров')

		return orders.reduce((prev, current) => {
			prev[current.orderId] = current
			return prev
		}, {})
	}

	// Получаем объем исходя из курса и суммы денег
	async buyAmount(rate) {
		try {
			const wallets = await this.getWallets()
			const distribution = []

			// Находим пустые кошельки
			for (let key in wallets) {
				if (this.percentWallet.includes(key) && wallets[key] === 0) {
					distribution.push({
						wallet: key,
						value: wallets[key]
					})
				}
			}

			// Если всего 1 кошелек пустой, отдаем всю сумму
			if (distribution.length === 1) {
				// Доступно для использования
				return parseFloat((wallets[this.purse] / rate).toFixed(8))
			} else {
				// Разделяем на части
				return parseFloat(((wallets[this.purse] / distribution.length) / rate).toFixed(8))
			}
		} catch (e) {
			console.log('Error buyAmount', e.error)
		}
	}

	// История сделок
	async getHistory() {
		try {
			const history = await this.query.allOrders({ symbol: this.pair, limit: 20 })
			const data = []

			for (let item in history) {
				data.push(history[item])
			}
			return data
		} catch (e) {
			console.log('Error getHistory', e.error)
		}
	}

	// Последняя транзакция
	async lastTransaction() {
		try {
			// Последняя транзакция
			const [order] = await this.query.allOrders({ symbol: this.pair, limit: 1 })

			// Добавляем методы для стандартизации разных бирж
			order.amount = order.origQty
			
			return order
		} catch (e) {
			// Возвращаем информацию, что можно совершить покупку
			return { type: 'sell' }
		}
	}

	// Создание ордера
	async trade(price, amount) {
		const trade = await this.query.newOrder({
			symbol: this.pair,
			side: this.task.type,
			type: 'limit',
			price: price,
			timeInForce: 'gtc',
			quantity: amount,
			timestamp: Date.now()
		})
		return trade
	}

	// Отмена ордера
	async cancelOrder(id) {
		const removeOrder = await this.query.cancelOrder({ symbol: this.pair, orderId: id })
		return removeOrder
	}

	// Информация об ордере
	async orderInfo(id) {
		const order = await this.query.queryOrder({ symbol: this.pair, orderId: id })

		// Добавляем методы для стандартизации разных бирж
		order.amount = order.start_amount
		order.timestamp = order.timestamp_created

		return order
	}
}

module.exports = Binance