const config = require('./config')
const db = require('./db')
const BTCE = require('btce')
const TelegramBot = require('node-telegram-bot-api')

// MongoDB модели
const models = require('./model')

// Инициализация соединения
const btce = new BTCE(config.key, config.secret)

// Инициализация бота
const bot = new TelegramBot(config.token, {polling: true})

// Валюта
const pair = 'btc_usd'

// Вся история движения
const history = []

// Свечи
const candles = []

let segment = null

// Кошельки
let wallet = null

// Количество начально загружаемых транзакций
let elements = 300

// Получаем данные кошельков
btce.getInfo((err, res) => {
  if (err) throw new Error(err)

  // Кошелек
  wallet = res.return.funds

  btce.ticker({pair: pair}, (err, res) => {
    if (err) throw new Error(err)
    const ticker = res.ticker

    setInterval(() => trades(), 1000)
  })
})

// Формирование структурированных данных купли/продажи
const trades = () => {
  btce.trades({count: elements, pair: pair}, (err, res) => {
    if (err) throw new Error(err)
    for (let item of res.reverse()) {
      // Пропускаем повторы
      if (findHistory(item.tid)) continue

      // Добавляем элемент в историю
      history.unshift(item)

      let date = new Date(item.date * 1000)
      if (segment === null || segment !== date.getMinutes()) {
        segment = date.getMinutes()

        // Добавление новой минутной свечи
        candles.unshift({
          date: date,
          timestamp: item.date,
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

    // Уменьшаем до 75 кол. новых данных
    elements = 75
  })
}

const findHistory = (tid) => {
  for (item of history) {
    if (tid === item.tid) return true
  }
  return false
}

// Активные ордеры
const activeOrders = () => new Promise((resolve, reject) => {
  btce.activeOrders({pair: pair}, (err, res) => {
    resolve(res)
  })
})

// Наблюдение за последними свечами, для выявления покупки или продажи
const observe = async () => {
  if (!candles.length) return false

  // Получение списка активных ордеров
  let orders = await activeOrders()

  console.log(orders)
  // Не пропускаем дальше, если есть активный ордер
  if (!orders.hasOwnProperty('error') && orders.error !== 'no orders') {
    return false
  }
  console.log('идем дальше')
  // Получаем последние свечи
  let data = candles.filter((item, index) => index <= 30)

  let type = 'buy'

  // Необходимо проанализировать данные и решить купить или продать
  if (type === 'buy') {

    // Текущая обстановка на рынке
    let current = data.shift()

    // Состояние
    let state = false

    // Поиск выгодного момента
    data.map(item => {
      if (current.price.min < item.price.min) {
        state = true
      }
    })

    if (state) {
      bot.sendMessage(config.user, `⌛ Запрос на покупку 0.005 BTC по курсу ${current.price.min}`)

      // Покупаем
      btce.trade({
        pair: 'btc_usd',
        type: 'buy',
        rate: 5000,
        amount: 0.00099542
      }, (err, res) => {
        if (!err) {
          console.log(err)
          throw new Error(err)
        }

        new models.Order({
          type: 'buy',
          pair: pair,
          rate: 5000,
          amount: 0.00099542
        }).save();

        // Оповещаем об покупке
        bot.sendMessage(config.user, `💰 Купили 0.005 BTC по курсу ${current.price.min}`)

        console.log(res)
      })

    } else {

    }
  } else if (type === 'sell') {

  }
}

// Отслеживать каждую минуту ситуацию на рынке
setInterval(() => observe(), 60000)
