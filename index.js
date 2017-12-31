const Wex = require('./exchanges/wex')

// Инициализация Wex ботов
const WexBTC = new Wex({ pair: 'btc_usd', percentWallet: 33 })
const WexETH = new Wex({ pair: 'eth_usd', percentWallet: 33 })
const WexLTC = new Wex({ pair: 'ltc_usd', percentWallet: 33 })

WexBTC.init()
WexETH.init()
WexLTC.init()
