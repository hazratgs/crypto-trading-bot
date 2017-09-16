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

// Задача
let task = null

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
    //console.log(`Error lastTrade: ${e}`)
    return {type: 'sell'}
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
const getMarkupPrice = (rate) => parseFloat(((rate * ((config.markup + config.commission) / 100)) + rate).toFixed(3))

// Получаем коммисию
const getCommission = (amount) => parseFloat((amount - (amount * (1 - (config.commission / 100)))).toFixed(8))

// Получаем объем исходя из курса и суммы денег
const buyAmount = async (rate) => {
  const info = await btce.getInfo()
  const usd = info.funds.usd
  return parseFloat((50 / rate).toFixed(8))
}

// Выставление на продажу
const sale = async (rate, amount) => {
  try {
    // Цена продажи
    let price = getMarkupPrice(rate)

    // Выставляем на продажу
    let buy = await btce.trade({
      pair: config.pair,
      type: 'sell',
      rate: price,
      amount: parseFloat((amount - getCommission(amount)).toFixed(8))
    })

    // Оповещаем пользователя о выставлении на продажу
    bot.sendMessage(config.user, `💰 Выставили на продажу ${amount} btc по курсу ${price}\n order: ${buy.order_id}`)

  } catch (e) {
    console.log(`Error Buy: ${e}`)
    console.log(e)

    bot.sendMessage(config.user, `Ошибка при продаже: ${e.error}`)
  }
}

// Вывод в консоль с текущим временем
const consoleTime = (text) => {
  const date = new Date()
  console.log(`${date.getHours()}:${date.getMinutes()} — ${text}`)
}

// Ожидание дна
const watch = async (transaction) => {
  if (!transaction || !task) return false

  // Если цена на протяжении долгого времени стоит высокой, удаляем задачу
  if (!task.repeat) {
    consoleTime('Задача сброщена, цена повысилась')
    task = null
    return false
  }

  // Покупка
  const buy = async () => {
    // Курс падает, ждем дна
    if (transaction.price < task.minPrice) {
      task.minPrice = transaction.price
    } else {

      // Если цена последней транзакции выросла
      // по сравнению с минимальной ценой, а так же все еще ниже часового минимума
      if (((1 - (task.minPrice / transaction.price)) * 1000) >= 3) {
        if (((1 - (task.minPrice / transaction.price)) * 1000) >= 4) {
          task.repeat--
          consoleTime(`Высокий [начало: ${task.price}, сейчас: ${transaction.price}, минимум: ${task.minPrice}]`)
          return false
        }
        consoleTime(`Дно [начало: ${task.price}, сейчас: ${transaction.price}, минимум: ${task.minPrice}]`)

        // Цена ниже установленного минимума
        if (transaction.price <= task.price) {
          consoleTime(`Рентабельно [начало: ${task.price}, сейчас: ${transaction.price}, минимум: ${task.minPrice}]`)

          // Повторно проверяем
          if (task.bottom !== 1) {
            task.bottom++
            consoleTime('Проверка суммы...')
            return false
          }

          try {
            consoleTime(`Инвестируем ${task.amount} [курс: ${transaction.price}, минимум: ${task.minPrice}, начало: ${task.price}]`)
            task = null

            // Минимальная цена продажи
            let markupPrice = getMarkupPrice(transaction.price)
            let amount = getCommission(task.amount)
            console.log(amount)

            // Покупаем валюту
            task = {
              type: 'sell',
              price: markupPrice,
              minPrice: markupPrice, // минимальная достигнутая цена
              amount: task.amount,
              repeat: 30
            }

            bot.sendMessage(config.user, `⌛ Запрос на покупку ${task.amount} btc по курсу ${transaction.price}`)
            /*****************
            // let buy = await btce.trade({
            //   pair: config.pair,
            //   type: 'buy',
            //   rate: transaction.price,
            //   amount: task.amount // с учетом коммисии
            // })

            // Оповещаем об покупке
            let consumption = (task.amount * transaction.price).toFixed(3)
            let commission = getCommission(task.amount)

            bot.sendMessage(config.user, `
⌛ Запрос на покупку ${task.amount} btc по курсу ${transaction.price}
расход: $${consumption}
получим: ${(task.amount - commission)} btc
коммисия: $${(commission * transaction.price)} (${commission} btc)
наценка: ${config.markup}%
мин. цена: $${task.minPrice}
макс. цена: $${task.price}
order: ${buy.order_id}`)
            */
          } catch (e) {
            console.log('Error watch buy:')
            console.log(task)
            console.log(e)
          }
        } else {
          // Цена выросла по сравнению с установленным минимумом...

          // Я думаю если она выросла не значительно, то можно брать...
          // Надо подумать, стоит ли брать
          consoleTime(`Цена выросла [начало: ${task.price}, сейчас: ${transaction.price}, минимум: ${task.minPrice}]`)
        }
      } else {
        // Цена немного выросла, но не значительно, ждем дна
        consoleTime(`Цена растет, но незначительно [начало: ${task.price}, сейчас: ${transaction.price}, минимум: ${task.minPrice}]`)
      }
    }
  }

  // Продажа
  const sell = async () => {
    // Курс растет, ждем пика
    if (transaction.price > task.maxPrice) {
      task.maxPrice = transaction.price
    } else {

      // Если цена последней транзакции снизилась
      // по сравнению с максимальной ценой, а так же все еще выше часового минимума
      if (((1 - (transaction.price / task.maxPrice)) * 1000) >= 3) {
        if (((1 - (transaction.price / task.maxPrice)) * 1000) >= 4) {
          task.repeat--
          consoleTime(`Упал [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)
          return false
        }

        consoleTime(`Максимум, курс снижается [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)

        // Цена выше установленного минимума
        if (transaction.price >= task.price) {
          consoleTime(`Цена выше установленного минимума [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)
          try {
            consoleTime(`Продаем ${task.amount} по курсу: ${transaction.price} [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)
            task = null
            // Продаем валюту
            bot.sendMessage(config.user, `⌛ Выставляем на продужу на покупку ${task.amount} btc по курсу ${transaction.price}`)

          } catch (e) {
            console.log('Error sell')
            console.log(e)
          }
        } else {
          // Цена упала по сравнению с установленным минимумом...

          // Я думаю если она упала не значительно, то можно продовать...
          // Надо подумать, стоит ли продовать
          consoleTime(`Цена упала по сравнению с устаовленным минимумом [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)
        }
      } else {
        // Цена немного упала, но не значительно, ждем пика
        console.log(`Цена ${transaction.price} упала по сравнению с пиком ${task.maxPrice} [начало: ${task.price}, сейчас: ${transaction.price}, максимум: ${task.maxPrice}]`)
      }
    }
  }

  // Выполняем тип в зависимости от задачи
  task.type === 'buy' ? buy() : sell()
}

// Отмена ордера по истичению 15 минут
const orderCancelLimit = async (id, order) => {
  // Если ордер выполнен, пропускам проверку
  if (order.status === 1) return false

  let currentTime = Math.floor(Date.now() / 1000)

  // Если срок жизни прошел, отменяем ордер
  if (currentTime > (order.timestamp_created + config.timeOrder)) {
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

        // очищаем задачу
        task = null

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

        // очищаем задачу
        task = null

        // Выставляем на продажу
        await sale(parseFloat(order.rate.toFixed(3)), parseFloat(order.start_amount.toFixed(8)))

      } else {

        // Оповещаем о продаже
        bot.sendMessage(config.user, `🎉 Продали ${config.amount} BTC по курсу ${order.rate}\nнаценка: ${order.markup}%\norder: ${id}
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

      // Отправляем данные в ожидание для покупки/продажи
      if (history.length > 5000) {
        await watch(item)
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
    if (lastTrade.type === 'buy' || task !== null) {
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
    const minPrice = parseFloat(((current.price.min * (0.05 / 100)) + current.price.min).toFixed(3))

    // объем исходя из всей суммы
    const amount = await buyAmount(minPrice)

    // Минимальная цена продажи
    const markupPrice = getMarkupPrice(minPrice)

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

        // Добавляем задачу
        task = {
          type: 'buy',
          price: minPrice,
          minPrice: minPrice, // минимальная достигнутая цена
          amount: amount,
          repeat: 30,
          bottom: 0 // если дно будет равно 1, то подтверждаем что это дно и покупаем
        }

        // Оповещаем об создании задания
        bot.sendMessage(config.user, `👁 Запущено наблюдение для покупки \n объем: ${amount} \n минимальная цена: ${minPrice}`)

      } catch (e) {
        console.log(`Buy error:`, e)
        bot.sendMessage(config.user, `Ошибка buy: ${e}`)
      }
    }
  } catch (e) {
    console.log(`Error observe: ${e}`)
  }
}

/** Старт наблюдения */
consoleTime('Старт бота')
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
