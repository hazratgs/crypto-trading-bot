const config = require('./config')
const BtceService = require('btc-e-v3')
const TelegramBot = require('node-telegram-bot-api')

// Инициализация соединения
const btce = new BtceService({ publicKey: config.key, secretKey: config.secret })

// Инициализация бота
const bot = new TelegramBot(config.token, {polling: true})

// Вся история движения
const history = []

// Активные ордеры
const orders = []

// Свечи
const candles = []

// время жизни ордера
const timeOrder = 300

// Поиск в истории транзакций
const findHistory = (tid) => {
  for (item of history) {
    if (tid === item.tid) return true
  }
  return false
}

// Последняя транзакция
const lastTransaction = async () => {
  try {
    // Последняя транзакция
    let trandeHistory = await btce.tradeHistory({ from: 0, count: 1 })
    let last = null
    for (let item in trandeHistory){
      if (!last) {
        last = trandeHistory[item]
        last.id = item
      }
    }
    return last
  } catch (e) {
    console.log(`Error lastTrade: ${e}`)
  }
}

// Удаление ордера
const removeOrder = (id) => {
  for (let key in orders){
    if (orders[key] === id) {
      orders.splice(key, 1)
    }
  }
}

// Формирование цены продажи
const getMarkupPirce = (rate) => parseFloat((rate * ((config.markup + config.commission) / 100)) + rate).toFixed(8)

// Получаем коммисию
const getCommission = (amount) => (amount - (amount * (1 - (config.commission / 100))))

// Получаем объем исходя из курса и суммы денег
const buyAmount = async (rate) => {
  const info = await btce.getInfo()
  const usd = info.funds.usd
  return (usd / rate).toFixed(8)
}

// Выставление на продажу
const sale = async (rate, amount) => {
  try {
    // Цена продажи
    let price = getMarkupPirce(rate)

    // Выставляем на продажу
    let buy = await btce.trade({
      pair: config.pair,
      type: 'sell',
      rate: price,
      amount: amount
    })

    // Оповещаем пользователя о выставлении на продажу
    bot.sendMessage(config.user, `💰 Выставили на продажу ${amount} btc по курсу ${price}\n order: ${buy.order_id}`)

  } catch (e) {
    console.log(`Error Buy: ${e}`)
    console.log(e)

    bot.sendMessage(config.user, `Ошибка при покупке: ${e.error}`)
  }
}

// Отмена ордера по истичению 15 минут
const orderCancelLimit = async (id, order) => {
  // Если ордер выполнен, пропускам проверку
  if (order.status === 1) return false

  let currentTime = Math.floor(Date.now() / 1000)

  // Если срок жизни прошел, отменяем ордер
  if (currentTime > (order.timestamp_created + timeOrder)) {
    try {
      // Отмена ордера
      await btce.cancelOrder(id)

      // Сообщаем об удалении
      console.log(`${id} истек срок`)
      return true
    } catch (e) {
      console.log(`Error orderCancelLimit: ${order.id}`)
      console.log(e)

      // ошибка удаления
      return false
    }
  }
  // Срок ордера еще не окончен
  return false
}

// Наблюдение за ордерами
const observeOrders = async () => {
  orders.map(async id => {
    try {
      const info = await btce.orderInfo(id)
      const order = info[id]

      // Если ордер отменен, удаляем его из наблюдения
      if (order.status === 2) {
        removeOrder(id)
        return false
      }

      // Если ордер на половину выполнен, но срок прошел
      // выставляем на продажу купленный объем
      if (order.status === 3) {
        console.log('...........................')
        console.log('Ордер на половину выполнен:')
        console.log(order)
        console.log('...........................')
        // Объем, который мы купили
        let buyAmount = (order.start_amount - order.amount)

        // Оповещаем пользователя о купле
        bot.sendMessage(config.user, `💰 Частично купили ${buyAmount} btc из ${order.start_amount} btc по курсу ${order.rate}\n order_id: ${id}`)

        // Выставляем частично купленный объем на продажу
        await sale(order.rate, buyAmount)

        // Удаляем частично выполненный ордер
        removeOrder(id)

        return false
      }

      // Проверяем срок ордера на покупку
      if (order.type === 'buy' && await orderCancelLimit(id, order)) return false

      // Оповещаем только о завершенных ордерах
      if (order.status !== 1) return false

      if (order.type === 'buy') {

        // Оповещаем пользователя о купле
        bot.sendMessage(config.user, `💰 Купили ${order.start_amount} BTC по курсу ${order.rate}\n order_id: ${id}`)

        // Выставляем на продажу
        await sale(order.rate, order.start_amount)

      } else {

        // Оповещаем о продаже
        bot.sendMessage(config.user, `
          🎉 Продали ${config.amount} BTC по курсу ${order.rate}\n
          наценка: ${order.markup}%\n
          order: ${id}
        `)
      }

      // Удаляем ордер из наблюдения
      removeOrder(id)

    } catch (e) {
      console.log('Error observeOrders:')
      console.log(e)
    }
  })
}

// Наблюдение за активными ордерами
const observeActiveOrders = async () => {
  try {
    // Получение списка активных ордеров
    let activeOrders = await btce.activeOrders(config.pair)
    for (let id in activeOrders) {
      if (!orders.filter(item => item === id).length) {
        orders.push(id)
      }
    }
  } catch (e) {
    if (e.error !== 'no orders') {
      console.log('Error observeActiveOrders:')
      console.log(e)
    }
  }
}

// Формирование структурированных данных купли/продажи
const trades = async () => {
  try {
    let trades = await btce.trades(config.pair, (!history.length ? 5000 : 150))
    for (let item of trades[config.pair].reverse()){

      // Пропускаем повторы
      if (findHistory(item.tid)) continue

      // Добавляем элемент в историю
      history.unshift(item)

      let date = new Date(item.timestamp * 1000)
      if (candles.length === 0 || candles[0].date.getMinutes() !== date.getMinutes()) {
        // Добавление новой минутной свечи
        candles.unshift({
          date: date,
          timestamp: item.timestamp,
          type: null,
          difference: 0,
          price: {},
          amount: 0,
          items: []
        })
      }

      // Вставляем событие в текущую свечи
      candles[0].items.unshift(item)

      // Расчет мин и макс
      candles[0].price.min = !candles[0].price.min
        ? item.price
        : (item.price < candles[0].price.min ? item.price : candles[0].price.min)

      candles[0].price.max = !candles[0].price.max
        ? item.price
        : (item.price > candles[0].price.max ? item.price : candles[0].price.max)

      // Объем
      candles[0].amount += item.amount
    }
  } catch (e) {
    console.log(`Error trades: ${e}`)
  }
}

// Наблюдение за последними свечами, для выявления покупки
const observe = async () => {
  try {
    if (!candles.length || candles.length < 120) {
      return false
    }

    try {
      // Получение списка активных ордеров
      await btce.activeOrders(config.pair)

      // Есть активный ордер, ожидаем завершения
      return false
    } catch (e) {
      // Не обрабатываем исключение
      // так как, нам нужно отсутствие ордеров
    }

    // Получаем последние свечи
    let data = candles.filter((item, index) => index <= 60)

    // Текущая обстановка на рынке
    let current = data.shift()

    // Последняя транзакция
    let lastTrade = await lastTransaction()

    // Ожидаем, что последняя транзакция, это продажа
    if (lastTrade.type === 'buy') {
      return false
    }

    // Поиск выгодного момента
    for (let item of data){
      if (current.price.min > item.price.min) {
        // Не самая выгодная цена, сделка сорвана
        return false
      }
    }

    // Курс по которому мы купим btc
    const minPrice = ((current.price.min * (0.05 / 100)) + current.price.min).toFixed(3)

    // объем сходя из всей суммы
    const amount = await buyAmount(minPrice)

    // А так же проверяем, реально ли продать с накидкой
    const markupPrice = getMarkupPirce(minPrice)
    console.log('markupPrice ' + markupPrice)
    let markupPriceMin = null
    let markupPriceMax = null

    let resolution = false

    // Получаем необходимое количество свечей
    let markupData = candles.filter((item, index) => index <= 720)
    for (let item of markupData) {

      // Если цена валюты достигала за последние n минут markupPrice
      // то разрешаем покупать валюту
      if (markupPrice <= item.price.max) {
        resolution = true
      }

      markupPriceMin = markupPriceMin === null
        ? item.price.min
        : (markupPriceMin < item.price.min ? markupPriceMin : item.price.min)

      markupPriceMax = markupPriceMax === null
        ? item.price.max
        : (markupPriceMax > item.price.max ? markupPriceMax : item.price.max)
    }

    if (resolution) {
      // Покупаем
      try {
        let buy = await btce.trade({
          pair: config.pair,
          type: 'buy',
          rate: minPrice,
          amount: amount // с учетом коммисии
        })

        // Оповещаем об покупке
        let consumption = (amount * minPrice).toFixed(3)
        let commission = getCommission(amount)

        bot.sendMessage(config.user, `⌛ Запрос на покупку ${amount} btc по курсу ${minPrice}\nрасход: $${consumption}\nполучим: ${(amount - commission)} btc\nкоммисия: $${(commission * minPrice)} (${commission} btc)\nнаценка: ${config.markup}%\nмин. цена: $${markupPriceMin}\nмакс. цена: $${markupPriceMax}\nцена продажи: ${markupPrice}\norder: ${buy.order_id}`)
      } catch (e) {
        console.log(`Buy error:`)
        console.log(e)
        console.log({
          pair: config.pair,
          type: 'buy',
          rate: minPrice,
          amount: amount // с учетом коммисии
        })

        bot.sendMessage(config.user, `Ошибка buy: ${e}`)
      }
    }
  } catch (e) {
    console.log(`Error observe: ${e}`)
  }
}

// Формирование структурированных данных транзакций
setTimeout(async () => {
  // Первая запуск загружает большой список данных
  await trades()

  // Теперь просто загружаем список постепенно
  setInterval(trades, 1000)
}, 1000)

// Наблюдение за ордерами
setInterval(observeActiveOrders, 1000)

// Наблюдение за ордерами
setInterval(observeOrders, 5000)

// Отслеживать каждую минуту ситуацию на рынке
setInterval(observe, 60000)
