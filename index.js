const BTCE = require('btce')
const config = require('./config')

// Инициализация соединения
const btce = new BTCE(config.key, config.secret)

// Получаем данные кошельков
btce.getInfo((err, res) => {
  if (err) throw new Error(err)

  // Кошелек
  const wallet = res.return.funds

  btce.ticker({pair: 'btc_usd'}, (err, res) => {
    if (err) throw new Error(err)
    const ticker = res.ticker

    btce.trades({count: 350, pair: 'btc_usd'}, (err, res) => {
      if (err) throw new Error(err)

      // Свечи
      const candles = {}
      let candle = 0
      let segment = null

      for (let item of res) {
        if (item.trade_type !== 'bid') continue
        segment = !segment ? item.date : segment
        if ((segment - item.date) > 60) {
          segment = item.date
          candle++
        }

        // Добавляем свечу
        if (!candles.hasOwnProperty(candle)){
          candles[candle] = {
            type: null,
            priceMin: null,
            priceMax: null,
            priceAvg: null,
            amount: null,
            items: []
          }
        }

        candles[candle].items.push(item)
      }

      // Определяем цвет свечей
      for (let item in candles) {

        let priceMin = null
        let priceMax = null
        for (element of candles[item].items) {
          priceMin = !priceMin ? element.price : (element.price < priceMin ? element.price : priceMin)
          priceMax = !priceMax ? element.price : (element.price > priceMax ? element.price : priceMax)
        }
        candles[item].priceMin = priceMin
        candles[item].priceMax = priceMax
        candles[item].priceAvg = ((priceMax - priceMin) / 2) + priceMin
      }

      let first = null
      for (let item in candles){
        if (!first) {
          console.log('Последняя цена ' + candles[item].priceMin)
          first = candles[item].priceMin
          continue
        }

        if (first < candles[item].priceMin) {
          console.log('Выгодно купить ' + candles[item].priceMin)
        } else {
          console.log('Не выгодно ' + candles[item].priceMin)
        }
      }
    })
  })
})