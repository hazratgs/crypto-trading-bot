const Wex = require('./exchanges/wex')

const WexTrader = new Wex({ pair: 'eth_rur', percentWallet: 33 })
WexTrader.init()