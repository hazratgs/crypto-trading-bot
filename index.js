const Wex = require('./exchanges/wex')

// Инициализация Wex ботов
const WexBTC = new Wex({ pair: 'btc_usd', percentWallet: 40 })
const WexETH = new Wex({ pair: 'eth_usd', percentWallet: 30 })
const WexLTC = new Wex({ pair: 'ltc_usd', percentWallet: 30 })

WexBTC.init()
WexETH.init()
WexLTC.init()
