const Wex = require('./exchanges/wex')

// Расппеделение бюджета USD Wex
const percentWalletUSD = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletRUR = ['btc', 'eth', 'ltc', 'dsh']

// Инициализация Wex ботов
const WexBTCUSD = new Wex({ pair: 'btc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexLTCUSD = new Wex({ pair: 'ltc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexETHUSD = new Wex({ pair: 'eth_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexDSHUSD = new Wex({ pair: 'dsh_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })

// Рублевые
const WexBTCRUR = new Wex({ pair: 'btc_rur', percentWallet: percentWalletRUR, commission: 0.2, markup: 1 })
const WexETHRUR = new Wex({ pair: 'eth_rur', percentWallet: percentWalletRUR, commission: 0.2, markup: 1 })
const WexLTCRUB = new Wex({ pair: 'ltc_rur', percentWallet: percentWalletRUR, commission: 0.2, markup: 1 })
const WexDSHRUR = new Wex({ pair: 'dsh_rur', percentWallet: percentWalletRUR, commission: 0.2, markup: 1 })

// Старт ботов
WexBTCUSD.init()
WexLTCUSD.init()
WexETHUSD.init()
WexDSHUSD.init()
WexETHRUR.init()
WexBTCRUR.init()
WexLTCRUB.init()
WexDSHRUR.init()
