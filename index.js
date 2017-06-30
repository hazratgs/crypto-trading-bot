const BTCE = require('btce')
const config = require('./config')

// Инициализация соединения
const btce = new BTCE(config.key, config.secret)

// Вся история движения
const history = []

// Свечи
const candles = []

let segment = null

// Количество начально загружаемых транзакций
let elements = 300

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
  btce.trades({count: elements, pair: 'btc_usd'}, (err, res) => {
    if (err) throw new Error(err)
    console.log(res.length)
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

// Наблюдение за последними свечами, для выявления покупки или продажи
const observe = (type) => {
  if (!candles.length) return false

  // Получаем последние 15 свечей
  let data = candles.filter((item, index) => index <= 15)

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

      console.log('Пора скупать')
      // Покупаем
      // btce.trade({
      //   pair: 'btc_usd',
      //   type: 'buy',
      //   rate: current.price.min,
      //   amount: 0.00099542
      // }, (err, res) => {
      //   if (!err) {
      //     console.log(err)
      //     throw new Error(err)
      //   }
      //
      //   console.log(res)
      // })

    } else {

    }
  } else if (type === 'sell') {

  }
}

// Отслеживать каждую минуту ситуацию на рынке
setInterval(() => observe('buy'), 60000)
