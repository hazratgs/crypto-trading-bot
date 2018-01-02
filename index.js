const Wex = require('./exchanges/wex')

// Расппеделение бюджета Wex
const percentWalletUSD = ['btc', 'eth', 'ltc']

// Инициализация Wex ботов
const WexBTC = new Wex({ pair: 'btc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexETH = new Wex({ pair: 'eth_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })
const WexLTC = new Wex({ pair: 'ltc_usd', percentWallet: percentWalletUSD, commission: 0.2, markup: 1 })

WexBTC.init()
WexETH.init()
WexLTC.init()
