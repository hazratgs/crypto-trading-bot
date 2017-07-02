const config = require('./config')
const BtceService = require('btc-e-v3')
const TelegramBot = require('node-telegram-bot-api')

// Инициализация соединения
const btce = new BtceService({ publicKey: config.key, secretKey: config.secret })

// Инициализация бота
const bot = new TelegramBot(config.token, {polling: true})

// Валюта
const pair = 'btc_usd'

// Наценка в %
const markup = 1

// Вся история движения
const history = []

// Свечи
const candles = []

let segment = null

// Объем преобритаемых btc
const amount = 0.001

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

}

// Формирование структурированных данных купли/продажи
const trades = async () => {
  try {
    let trades = await btce.trades(pair)
    for (let item of trades[pair].reverse()){

      // Пропускаем повторы
      if (findHistory(item.tid)) continue

      // Добавляем элемент в историю
      history.unshift(item)

      let date = new Date(item.timestamp * 1000)
      if (segment === null || segment !== date.getMinutes()) {
        segment = date.getMinutes()

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



// Наблюдение за последними свечами, для выявления покупки или продажи
const observe = async () => {
  try {
    if (!candles.length || candles.length < 10) {
      return false
    }

    try {
      // Получение списка активных ордеров
      await btce.activeOrders(pair)

      // Есть активный ордер, ожидаем завершения
      return false
    } catch (e) {
      // Не обрабатываем исключение
      // так как, нам нужно отсутствие ордеров
    }

    // Получаем последние свечи
    let data = candles.filter((item, index) => index <= 60)

    // Последняя транзакция
    let lastTrade = await lastTransaction()

    // Определяем
    let type = lastTrade.type === 'buy' ? 'sell' : 'buy'

    // Необходимо проанализировать данные и решить купить или продать
    if (type === 'buy') {

      // Текущая обстановка на рынке
      let current = data.shift()

      // Поиск выгодного момента
      for (let item of data){
        if (current.price.min > item.price.min) {
          // Не самая выгодная цена, сделка сорвана
          return false
        }
      }

      // А так же проверяем, реально ли продать с 2% накидкой
      let markupPrice = (current.price.min * (markup / 100)) + current.price.min

      // Покупаем
      try {
        let buy = await btce.trade({
          pair: pair,
          type: type,
          rate: current.price.min,
          amount: amount
        })

        // console.log(buy.order_id)

        // Оповещаем об покупке
        bot.sendMessage(config.user, `⌛ Запрос на покупку ${amount} BTC по курсу ${current.price.min}`)

      } catch (e) {
        console.log(`Buy error: ${e}`)
        bot.sendMessage(config.user, `Ошибка buy: ${e}`)
      }
    } else if (type === 'sell') {

    }

  } catch (e) {
    console.log(`Error observe: ${e}`)
  }
}

// Формирование структурированных данных купли/продажи
setInterval(trades, 1000)

// Отслеживать каждую минуту ситуацию на рынке
setInterval(observe, 60000)