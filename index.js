const config = require('./config')
const BtceService = require('btc-e-v3')
const TelegramBot = require('node-telegram-bot-api')

// Инициализация соединения
const btce = new BtceService({ publicKey: config.key, secretKey: config.secret })

// Инициализация бота
const bot = new TelegramBot(config.token, {polling: true})

// Вся история движения
const history = []

// Свечи
const candles = []

// Список ордеров на наблюдении
const orders = []

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

// Наблюдение за ордерами
const observeOrders = () => {
  orders.map(async order => {
    try {
      let res = await btce.orderInfo(order.id)
      let info = res[order.id]

      // Оповещаем только о завершенных ордерах
      if (info.status !== 1) return false

      if (info.type === 'buy') {

        // Оповещаем пользователя о купле
        bot.sendMessage(config.user, `💰 Купили ${info.start_amount} BTC по курсу ${info.rate}\n order_id: ${order.id}`)

        try {
          // Выставляем на продажу ...
          let buy = await btce.trade({
            pair: config.pair,
            type: 'sell',
            rate: order.sell,
            amount: config.amount
          })

          // Наблюдаем за ордером
          orders.push({
            id: buy.order_id,
            price: order.price, // сумма закупки
            sell: order.sell,
            markup: config.markup
          })

          // Оповещаем пользователя о выставлении на продажу
          bot.sendMessage(config.user, `💰 Выставили на продажу ${info.start_amount} BTC по курсу ${order.sell}\n order_id: ${buy.order_id}`)

        } catch (e) {
          console.log(`Error observeOrders Buy: ${e}`)
          bot.sendMessage(config.user, `Ошибка при покупке: ${e.error}`)
        }
      } else {

        // Оповещаем о продаже
        bot.sendMessage(config.user, `
          🎉 Продали ${info.start_amount} BTC по курсу ${info.rate}\n
          купили: $${order.price}\n
          продали: $${order.sell} (${info.rate} по данным btc-e с учетом коммисии)\n
          наценка: ${order.markup}%\n
          order_id: ${order.id}
        `)
      }

      // Удаляем выполненный order из orders
      for (let key in orders){
        if (orders[key].id === order.id) {
          orders.splice(key, 1)
        }
      }
    } catch (e) {
      console.log(`Error observeOrders:`)
      console.log(e)
    }
  })
}

// Формирование структурированных данных купли/продажи
const trades = async () => {
  try {
    let trades = await btce.trades(config.pair, (!history.length ? 1000 : 150))
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
    if (!candles.length || candles.length < 240) {
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

    // Объем с коммисией не более 8 нулей
    let amount = (config.amount / (1 - (config.commission / 100))).toFixed(8)

    const minPrice = (current.price.min * (0.05 / 100)) + current.price.min

    // А так же проверяем, реально ли продать с накидкой
    let markupPrice = (minPrice * ((config.markup + (config.commission * 2)) / 100)) + minPrice
    let markupPriceMin = null
    let markupPriceMax = null

    // Округляем до сотых
    markupPrice = markupPrice.toFixed(3)

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

        // Наблюдаем за ордером
        orders.push({
          id: buy.order_id,
          price: minPrice,
          sell: markupPrice,
          markup: config.markup,
          amount: amount
        })

        // Оповещаем об покупке
        let consumption = (amount * minPrice).toFixed(3)
        let commission = ((config.amount * markupPrice) * (config.commission / 100))
        let income = ((config.amount * markupPrice) - commission).toFixed(3)

        bot.sendMessage(config.user, `
          ⌛ Запрос на покупку ${amount} BTC по курсу ${minPrice}\n
          расход: $${consumption}\n
          получим: ${config.amount} BTC\n
          наценка: ${config.markup}%\n
          общая прибыль: $${(config.amount * markupPrice)}\n
          заработаем: $${income}\n
          чистая прибыль: $${(income - consumption)}\n
          коммисия: $${commission}\n
          мин. цена: ${markupPriceMin}\n
          макс. цена: ${markupPriceMax}\n
          цена продажи: ${markupPrice}\n
          order id: ${buy.order_id}
        `)
      } catch (e) {
        console.log(`Buy error:`)
        console.log(e)
        bot.sendMessage(config.user, `Ошибка buy: ${e}`)
      }
    }
  } catch (e) {
    console.log(`Error observe: ${e}`)
  }
}

// Формирование структурированных данных транзакций
// setInterval(trades, 1000)

// Наблюдение за ордерами
// setInterval(observeOrders, 4000)

// Отслеживать каждую минуту ситуацию на рынке
// setInterval(observe, 60000)
