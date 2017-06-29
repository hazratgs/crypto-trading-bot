const BTCE = require('btce')
const config = require('./config')

// Инициализация соединения
const btce = new BTCE(config.key, config.secret)

// Вся история движения
const history = []

// Свечи
const candles = []

let segment = null

// Получаем данные кошельков
btce.getInfo((err, res) => {
  if (err) throw new Error(err)

  // Кошелек
  const wallet = res.return.funds

  btce.ticker({pair: 'btc_usd'}, (err, res) => {
    if (err) throw new Error(err)
    const ticker = res.ticker

    setInterval(() => trades(), 1000)
  })
})

// Формирование структурированных данных купли/продажи
const trades = () => {
  btce.trades({count: 150, pair: 'btc_usd'}, (err, res) => {
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
  })
}

const findHistory = (tid) => {
  for (item of history) {
    if (tid === item.tid) return true
  }
  return false
}

// Наблюдение за последними свечами, для выявления покупки или продажи
const observe = (type) => {
  if (!candles.length) return false

  // Получаем последние 15 свечей
  let data = candles.filter((item, index) => index <= 15)

  // Необходимо проанализировать данные и решить купить или продать
  if (type === 'buy') {

    // Определяем цвет свечи
    let last = null
    let dataColor = data.reverse().map(item => {
      if (last === null) {
        last = item
        return item
      }

      // Определяем цвет свечи
      item.type = item.price.min > last.price.min

      // Разница в цене
      item.difference = item.price.min - last.price.min

      // Текущий элемент для сравнения со следующим
      last = item

      return item
    })

    data = dataColor.reverse()
    console.log(data)

  } else if (type === 'sell') {

  }
}

setInterval(() => observe('buy'), 60000)
