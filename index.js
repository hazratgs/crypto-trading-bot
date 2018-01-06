const Telegram = require('./libs/telegram')
const Wex = require('./exchanges/wex')

const telegram = new Telegram()

// const Bitstamp = require('./exchanges/bitstamp')

// Расппеделение бюджета USD Wex
const percentWalletUSDWex = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletBTCWex = ['eth', 'ltc', 'dsh']

// Стандартные параметры бота
const defaultParams = {
    api: null,
    pair: null,
    percentWallet: null,
    commission: 0.2,
    markup: 0.4,
    telegram: telegram
}

// Инициализация Wex ботов USD
const WexBTCUSD = new Wex({ ...defaultParams, api: 'wex', pair: 'btc_usd', percentWallet: percentWalletUSDWex })
const WexLTCUSD = new Wex({ ...defaultParams, api: 'wex', pair: 'ltc_usd', percentWallet: percentWalletUSDWex })
const WexETHUSD = new Wex({ ...defaultParams, api: 'wex', pair: 'eth_usd', percentWallet: percentWalletUSDWex })
const WexDSHUSD = new Wex({ ...defaultParams, api: 'wex', pair: 'dsh_usd', percentWallet: percentWalletUSDWex })

// Bitcoen Wex
const WexETHBTC = new Wex({ ...defaultParams, api: 'wexBTC', pair: 'eth_btc', percentWallet: percentWalletBTCWex })
const WexLTCBTC = new Wex({ ...defaultParams, api: 'wexBTC', pair: 'ltc_btc', percentWallet: percentWalletBTCWex })
const WexDSHBTC = new Wex({ ...defaultParams, api: 'wexBTC', pair: 'dsh_btc', percentWallet: percentWalletBTCWex })

// Инициализация Bitfinex
// const BitfinexBTC = new Bitfinex({ pair: 'dsh_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })

// Инициализация Bitstamp
// const BitstampBTC = new Bitstamp({ api: 'wex', pair: 'btcusd', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })

// Старт Wex ботов
WexBTCUSD.init()
WexLTCUSD.init()
WexETHUSD.init()
WexDSHUSD.init()
WexETHBTC.init()
WexLTCBTC.init()
WexDSHBTC.init()

// BitfinexBTC.init()

// Старт Bitstamp ботов
// BitstampBTC.init()
