const TelegramBot = require('node-telegram-bot-api')
const moment = require('moment')
const config = require('../conf')

class Telegram {
  constructor() {
    this.bot = new TelegramBot(config.token, { polling: true })
    this.user = config.user

    // Кнопки
    this.buttons = ['⛏ Активные задачи', '💰 Заработок', '💵 Баланс']

    // Отправка кнопок
    this.keyboard('Бот запущен', this.buttons)

    // Ссылки на объект
    this.apps = []

    this.router()
  }

  init(app) {
    // Устанавливаем ссылку на объект
    this.apps.push(app)
  }

  router() {
    // Обработка telegram событий
    this.bot.on('message', msg => {
      switch (msg.text) {
        case '⛏ Активные задачи':
          return this.task()

        case '💰 Заработок':
          return this.cashback()

        case '💵 Баланс':
          return this.balance()
      }
    })
  }

  // Активные задачи
  task() {
    // Составляем список задач
    const message = this.apps.map(item => {
      if (!item.task) return `${item.pair.toUpperCase()} - нет активной задачи`
      const [coin] = item.pair.split('_')
      const [, wallet] = item.pair.split('_')

      const state = item.task.currentPrice > item.task.price ? '+' : '-'
      const percent = Math.abs(100 - ((item.task.currentPrice * 100) / item.task.price))
      const income = Math.abs(item.task.price - item.task.currentPrice)

      const minPriceBuy = item.task.minPrice - item.task.currentPrice

      return item.task.type === 'sell'
        ? `${item.pair.toUpperCase()} - 📈 Продажа\n
            Объем: ${item.task.amount} ${coin}\n
            Закупка: ${item.task.buyAmount} ${wallet}\n
            Продажа: ${item.task.price} ${wallet}\n
            Макс. цена: ${item.task.maxPrice} ${wallet}\n
            Текущая цена: ${item.task.currentPrice} ${wallet} (${state}${income} ${wallet}, ${state}${percent}%)\n
            Время: ${moment(item.task.timestamp).subtract(1, 'hours').calendar()}
          `
        : `${item.pair.toUpperCase()} - 📉 Покупка\n
            Объем: ${item.task.amount} ${coin}\n
            Мин. цена: ${item.task.minPrice} ${wallet}\n
            Текущая цена: ${item.task.currentPrice} ${wallet} (${minPriceBuy} ${wallet})\n
            Время: ${moment(item.task.timestamp).subtract(1, 'hours').calendar()}
          `
    })

    // Отправляем разработчику
    this.keyboard(message.join('\n• • •\n'), this.buttons)
  }

  // Заработок
  cashback() {
    const cashback = this.apps.map(item => ({ type: item.pair.split('_')[1], income: item.income }))
      .reduce((prev, current) => {
        if (!prev) return { [current.type]: current.income }
        if (!prev[current.type]) return { ...prev, [current.type]: current.income }
        return { ...prev, [current.type]: prev[current.type] + current.income }
      }, {}
    )
    
    let message = `Заработок:\n`
    for (let item in cashback) {
      message += `${cashback[item]} ${item}\n`
    }
    
    this.keyboard(message, this.buttons)
  }

  // Баланс кошельков 
  balance() {
    
  }

  // Отправка сообщения
  sendMessage(text) {
    this.bot.sendMessage(config.user, text)
  }

  // Отправка Сообщения с клавиатурой
  keyboard(message, data, inline = 2) {
    let opt = [],
      arr = [],
      i = 0;

    // Если поступил объект map, берем данные из текущей ветки
    if (!Array.isArray(data)) {
      for (let item in data.children) {
        arr.push(item)
      }
    } else {
      // Поступил обычный массив
      arr = data;
    }

    for (let key of arr) {
      // Если inline больше 1, то вставляем inline элеменов в одну строку
      if (i < inline && opt[opt.length - 1] !== undefined) {
        opt[opt.length - 1].push({
          text: key
        });
      } else {
        if (i === inline) i = 0;

        opt.push([{
          text: key
        }]);
      }

      i++
    }

    this.bot.sendMessage(this.user, message, {
      parse_mode: 'html',
      reply_markup: {
        keyboard: opt,
        resize_keyboard: true,
        // one_time_keyboard: true
      },
    });
  }
}

module.exports = Telegram