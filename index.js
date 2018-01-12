const Telegram = require('./libs/telegram')
const Wex = require('./exchanges/wex')
const Binance = require('./exchanges/binance')

// Инициализация telegram бота
const telegram = new Telegram()

// Расппеделение бюджета USD Wex
const percentWalletUSDWex = ['btc', 'eth', 'ltc', 'dsh']

// Расппеделение бюджета RUR Wex
const percentWalletBTCWex = ['eth', 'ltc', 'dsh']

// Распределение бюджета Binance
const percentWalletETHBinance = ['XRP', 'NEO', 'BCC', 'ETC']

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
// const WexBTCUSD = new Wex({
//     ...defaultParams,
//     api: 'wex',
//     pair: 'btc_usd',
//     purse: 'usd',
//     percentWallet: percentWalletUSDWex
// })
// const WexLTCUSD = new Wex({
//     ...defaultParams,
//     api: 'wex',
//     pair: 'ltc_usd',
//     purse: 'usd',
//     percentWallet: percentWalletUSDWex
// })
// const WexETHUSD = new Wex({
//     ...defaultParams,
//     api: 'wex',
//     pair: 'eth_usd',
//     purse: 'usd',
//     percentWallet: percentWalletUSDWex
// })
// const WexDSHUSD = new Wex({
//     ...defaultParams,
//     api: 'wex',
//     pair: 'dsh_usd',
//     purse: 'usd',
//     percentWallet: percentWalletUSDWex
// })

// Bitcoen Wex
// const WexETHBTC = new Wex({
//     ...defaultParams,
//     api: 'wexBTC',
//     pair: 'eth_btc',
//     purse: 'eth',
//     percentWallet: percentWalletBTCWex
// })
// const WexLTCBTC = new Wex({
//     ...defaultParams,
//     api: 'wexBTC',
//     pair: 'ltc_btc',
//     purse: 'eth',
//     percentWallet: percentWalletBTCWex
// })
// const WexDSHBTC = new Wex({
//     ...defaultParams,
//     api: 'wexBTC',
//     pair: 'dsh_btc',
//     purse: 'eth',
//     percentWallet: percentWalletBTCWex
// })

// Binance бот
const BinanceETHXRP = new Binance({
    ...defaultParams,
    api: 'binance',
    pair: 'XRPETH',
    purse: 'ETH',
    percentWallet: percentWalletETHBinance
})
const BinanceETHNEO = new Binance({
    ...defaultParams,
    api: 'binance',
    pair: 'NEOETH',
    purse: 'ETH',
    percentWallet: percentWalletETHBinance
})
const BinanceETHBCC = new Binance({
    ...defaultParams,
    api: 'binance',
    pair: 'BCCETH',
    purse: 'ETH',
    percentWallet: percentWalletETHBinance
})
// const BinanceETHETC = new Binance({
//     ...defaultParams,
//     api: 'binance',
//     pair: 'ETCETH',
//     purse: 'ETH',
//     percentWallet: percentWalletETHBinance
// })
 


// Старт Wex ботов
// WexBTCUSD.init()
// WexLTCUSD.init()
// WexETHUSD.init()
// WexDSHUSD.init()
// WexETHBTC.init()
// WexLTCBTC.init()
// WexDSHBTC.init()

// Старт Binance ботов
BinanceETHXRP.init()
BinanceETHNEO.init()
BinanceETHBCC.init()
// BinanceETHETC.init()
