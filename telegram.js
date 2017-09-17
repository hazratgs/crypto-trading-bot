const TelegramBot = require('node-telegram-bot-api')
const config = require('./config')

let bot = null
try {
  bot = new TelegramBot(config.token, {polling: true})
} catch (e) {
  console.log('Ошибка при соединение с api.telegram.com')
}

module.exports = (text) => {
  try {
    bot.sendMessage(config.user, text)
  } catch (e) {
    console.log('Ошибка отправки данных')
  }
}
