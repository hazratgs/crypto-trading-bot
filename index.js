const Wex = require('./exchanges/wex')
const Bitfinex = require('./exchanges/bitfinex')

// Расппеделение бюджета USD Wex
const percentWalletUSDWex = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletRURWex = ['btc', 'eth', 'ltc', 'dsh']

// Инициализация Wex ботов
const WexBTCUSD = new Wex({
    api: 'wex',
    pair: 'btc_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 1
})
const WexLTCUSD = new Wex({
    api: 'wex',
    pair: 'ltc_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 1
})
const WexETHUSD = new Wex({
    api: 'wex',
    pair: 'eth_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 1
})
const WexDSHUSD = new Wex({
    api: 'wex',
    pair: 'dsh_usd',
    percentWallet: percentWalletUSDWex,
    commission: 0.2,
    markup: 1
})

// Рублевые Wex
const WexBTCRUR = new Wex({
    api: 'wexRur',
    pair: 'btc_rur',
    percentWallet: percentWalletRURWex,
    commission: 0.2,
    markup: 1
})
const WexETHRUR = new Wex({
    api: 'wexRur',
    pair: 'eth_rur',
    percentWallet: percentWalletRURWex,
    commission: 0.2,
    markup: 1
})
const WexLTCRUB = new Wex({
    api: 'wexRur',
    pair: 'ltc_rur',
    percentWallet: percentWalletRURWex,
    commission: 0.2,
    markup: 1
})
const WexDSHRUR = new Wex({
    api: 'wexRur',
    pair: 'dsh_rur',
    percentWallet: percentWalletRURWex,
    commission: 0.2,
    markup: 1
})

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
