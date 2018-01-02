const Wex = require('./exchanges/wex')

// Расппеделение бюджета USD Wex
const percentWalletUSD = ['btc', 'eth', 'ltc']

// Расппеделение бюджета RUR Wex
const percentWalletRUR = ['eth']

// Инициализация Wex ботов
const WexBTCUSD = new Wex({ pair: 'btc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexLTCUSD = new Wex({ pair: 'ltc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexETHUSD = new Wex({ pair: 'eth_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
// const WexETHRUR = new Wex({ pair: 'eth_rur', percentWallet: percentWalletRUR, commission: 0.2, markup: 1 })

WexBTCUSD.init()
WexLTCUSD.init()
WexETHUSD.init()
// WexETHRUR.init()
