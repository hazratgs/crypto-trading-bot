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

    btce.trades({count: 150, pair: 'btc_usd'}, (err, res) => {
      if (err) throw new Error(err)

      // Свечи
      const candles = {}
      let candle = 0
      let segment

      for (item of res) {
        segment = !segment ? item.date : segment
        if ((segment - item.date) > 60) {
          segment = item.date
          candle++
        }

        // Добавляем свечу
        if (!candles.hasOwnProperty(candle)){
          candles[candle] = []
        }

        candles[candle].push(item)
      }


    })
  })
})