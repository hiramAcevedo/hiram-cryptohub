/**
 * Datos de fallback para cuando la API de CoinGecko no está disponible
 */

// Lista de las principales criptomonedas para el autocomplete
export const fallbackCoinList = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 38245.32
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 2345.67
  },
  {
    id: "ripple",
    symbol: "xrp",
    name: "XRP",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    current_price: 0.5634
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    current_price: 0.4876
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 142.56
  },
  {
    id: "polkadot",
    symbol: "dot",
    name: "Polkadot",
    image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    current_price: 6.78
  },
  {
    id: "dogecoin",
    symbol: "doge",
    name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    current_price: 0.0872
  },
  {
    id: "litecoin",
    symbol: "ltc",
    name: "Litecoin",
    image: "https://assets.coingecko.com/coins/images/2/large/litecoin.png",
    current_price: 73.45
  },
  {
    id: "chainlink",
    symbol: "link",
    name: "Chainlink",
    image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    current_price: 16.54
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png",
    current_price: 1.0
  }
];

// Precios de fallback para las principales criptomonedas
export const generateFallbackPrices = (coinIds) => {
  const fallbackPrices = {};
  
  // Precios base para algunas criptomonedas comunes
  const basePrices = {
    bitcoin: { usd: 38245.32, mxn: 38245.32 * 17.5 },
    ethereum: { usd: 2345.67, mxn: 2345.67 * 17.5 },
    ripple: { usd: 0.5634, mxn: 0.5634 * 17.5 },
    cardano: { usd: 0.4876, mxn: 0.4876 * 17.5 },
    solana: { usd: 142.56, mxn: 142.56 * 17.5 },
    polkadot: { usd: 6.78, mxn: 6.78 * 17.5 },
    dogecoin: { usd: 0.0872, mxn: 0.0872 * 17.5 },
    litecoin: { usd: 73.45, mxn: 73.45 * 17.5 },
    chainlink: { usd: 16.54, mxn: 16.54 * 17.5 },
    tether: { usd: 1.0, mxn: 1.0 * 17.5 }
  };
  
  // Generar precios de fallback para cada moneda solicitada
  coinIds.forEach(id => {
    if (basePrices[id]) {
      fallbackPrices[id] = basePrices[id];
    } else {
      // Para monedas desconocidas, generar un precio aleatorio
      const randomPrice = (Math.random() * 100).toFixed(2);
      fallbackPrices[id] = {
        usd: parseFloat(randomPrice),
        mxn: parseFloat(randomPrice) * 17.5
      };
    }
  });
  
  return fallbackPrices;
}; 