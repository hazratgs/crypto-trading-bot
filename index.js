const Wex = require('./exchanges/wex')
// const Bitstamp = require('./exchanges/bitstamp')

// Расппеделение бюджета USD Wex
const percentWalletUSDWex = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletBTCWex = ['eth', 'ltc', 'dsh']

// Инициализация Wex ботов USD
const WexBTCUSD = new Wex({
    api: 'wex',
    pair: 'btc_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 0.4
})
const WexLTCUSD = new Wex({
    api: 'wex',
    pair: 'ltc_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 0.4
})
const WexETHUSD = new Wex({
    api: 'wex',
    pair: 'eth_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 0.4
})
const WexDSHUSD = new Wex({
    api: 'wex',
    pair: 'dsh_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 0.4
})

// Bitcoen Wex
const WexETHBTC = new Wex({
    api: 'wexBTC',
    pair: 'eth_btc',
    percentWallet: percentWalletBTCWex,
    commission: 0.2,
    markup: 0.4
})
const WexLTCBTC = new Wex({
    api: 'wexBTC',
    pair: 'ltc_btc',
    percentWallet: percentWalletBTCWex,
    commission: 0.2,
    markup: 0.4
})
const WexDSHBTC = new Wex({
    api: 'wexBTC',
    pair: 'dsh_btc',
    percentWallet: percentWalletBTCWex,
    commission: 0.2,
    markup: 0.4
})

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
