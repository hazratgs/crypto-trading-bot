const Wex = require('./exchanges/wex')
const Bitfinex = require('./exchanges/bitfinex')

// Расппеделение бюджета USD Wex
const percentWalletUSDWex = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletRURWex = ['btc', 'eth', 'ltc', 'dsh']

// Инициализация Wex ботов
const WexBTCUSD = new Wex({ pair: 'btc_usd', percentWallet: percentWalletUSDWex, commission: 0.2, markup: 1 })
const WexLTCUSD = new Wex({ pair: 'ltc_usd', percentWallet: percentWalletUSDWex, commission: 0.2, markup: 1 })
const WexETHUSD = new Wex({ pair: 'eth_usd', percentWallet: percentWalletUSDWex, commission: 0.2, markup: 1 })
const WexDSHUSD = new Wex({ pair: 'dsh_usd', percentWallet: percentWalletUSDWex, commission: 0.2, markup: 1 })

// Рублевые Wex
const WexBTCRUR = new Wex({ pair: 'btc_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })
const WexETHRUR = new Wex({ pair: 'eth_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })
const WexLTCRUB = new Wex({ pair: 'ltc_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })
const WexDSHRUR = new Wex({ pair: 'dsh_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })

// Инициализация Bitfinex
// const BitfinexBTC = new Bitfinex({ pair: 'dsh_rur', percentWallet: percentWalletRURWex, commission: 0.2, markup: 1 })

// Старт Wex ботов
WexBTCUSD.init()
WexLTCUSD.init()
WexETHUSD.init()
WexDSHUSD.init()
WexBTCRUR.init()
WexETHRUR.init()
WexLTCRUB.init()
WexDSHRUR.init()

// BitfinexBTC.init()
