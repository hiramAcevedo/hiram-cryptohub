/**
 * Servicios de API para diferentes tipos de activos financieros
 */

import axios from 'axios';
import { 
  setCacheData, 
  getCacheData, 
  hasCacheData, 
  generateCacheKey 
} from './cacheService';

// Función para obtener las claves API (primero de sessionStorage, luego de variables de entorno)
const getApiKey = (keyName, envKey) => {
  if (typeof window !== 'undefined') {
    const sessionKey = sessionStorage.getItem(`api_key_${keyName}`);
    if (sessionKey) {
      return sessionKey;
    }
  }
  return envKey || '';
};

// Inicializar claves de API (se actualizarán al momento de usar)
let ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo';
let EXCHANGE_RATE_API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '';

// URLs base para las diferentes APIs - se actualizarán dinámicamente cuando se usen
const API_URLS = {
  crypto: {
    primary: 'https://api.coingecko.com/api/v3',
    proxy: 'https://corsproxy.io/?https://api.coingecko.com/api/v3'
  },
  stock: {
    primary: 'https://www.alphavantage.co/query',
    proxy: 'https://corsproxy.io/?https://www.alphavantage.co/query'
  },
  forex: {
    // Nuevo método de construcción de URL con opciones alternativas
    get primary() {
      EXCHANGE_RATE_API_KEY = getApiKey('exchangerate', process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '');
      if (!EXCHANGE_RATE_API_KEY) {
        console.warn('No se encontró clave API para Exchange Rate. Utilizando datos de fallback.');
        return null; // Indicar que no hay URL válida
      }
      // Se intentará v6 por defecto
      return `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;
    },
    get proxy() {
      EXCHANGE_RATE_API_KEY = getApiKey('exchangerate', process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '');
      if (!EXCHANGE_RATE_API_KEY) {
        return null;
      }
      return `https://corsproxy.io/?https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;
    },
    // Rutas alternativas en caso de problemas con la API principal
    get backupUrls() {
      const key = getApiKey('exchangerate', process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '');
      if (!key) return [];
      
      return [
        // Intentar con otras versiones de la API
        `https://v6.exchangerate-api.com/v6/${key}`,
        `https://open.er-api.com/v6/latest`  // Servicio alternativo gratuito
      ];
    }
  }
};

// Claves de API para usar en los parámetros de las solicitudes - función getter
const getApiKeys = () => ({
  alphavantage: getApiKey('alphavantage', process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo')
});

/**
 * Función genérica para realizar solicitudes con reintentos y caché
 */
const fetchWithRetry = async (baseUrlObj, endpoint, params, maxRetries = 2) => {
  // Actualizar claves API antes de la solicitud
  if (params && params.apikey && params.apikey === 'demo') {
    params.apikey = getApiKeys().alphavantage;
  }

  // Generar clave de caché
  const cacheKey = generateCacheKey(`${baseUrlObj.primary}${endpoint}`, params);
  
  // Verificar si tenemos datos en caché válidos
  if (hasCacheData(cacheKey)) {
    console.log(`Usando datos en caché para: ${cacheKey}`);
    return getCacheData(cacheKey);
  }
  
  let lastError;
  let currentTry = 0;
  
  while (currentTry <= maxRetries) {
    try {
      const baseUrl = currentTry === 0 ? baseUrlObj.primary : baseUrlObj.proxy;
      const url = endpoint ? `${baseUrl}${endpoint}` : baseUrl;
      console.log(`Intento ${currentTry+1}: Conectando a ${url}`);
      
      const response = await axios.get(url, {
        params,
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Guardar en caché antes de devolver los datos
      const data = response.data;
      setCacheData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error(`Error en intento ${currentTry+1}:`, error.message);
      lastError = error;
      currentTry++;
      
      if (currentTry <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
};

/**
 * Servicios para criptomonedas (CoinGecko)
 */
export const cryptoService = {
  baseUrl: API_URLS.crypto.primary,
  
  // Obtener lista de criptomonedas
  getCoins: async () => {
    return fetchWithRetry(API_URLS.crypto, '/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250,
      page: 1,
      sparkline: false
    });
  },
  
  // Obtener precios de criptomonedas
  getPrices: async (coinIds, currencies = ['usd', 'mxn']) => {
    return fetchWithRetry(API_URLS.crypto, '/simple/price', {
      ids: coinIds.join(','),
      vs_currencies: currencies.join(',')
    });
  },
  
  // Obtener detalle de una moneda
  getCoinDetails: async (coinId) => {
    return fetchWithRetry(API_URLS.crypto, `/coins/${coinId}`, {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false
    });
  }
};

/**
 * Servicios para acciones (Alpha Vantage)
 */
export const stockService = {
  baseUrl: API_URLS.stock.primary,
  
  // Buscar símbolos de acciones
  searchSymbols: async (keywords) => {
    return fetchWithRetry(API_URLS.stock, '', {
      function: 'SYMBOL_SEARCH',
      keywords,
      apikey: getApiKeys().alphavantage
    });
  },
  
  // Obtener información de una acción
  getStockQuote: async (symbol) => {
    return fetchWithRetry(API_URLS.stock, '', {
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: getApiKeys().alphavantage
    });
  },
  
  // Obtener información histórica
  getHistoricalData: async (symbol) => {
    return fetchWithRetry(API_URLS.stock, '', {
      function: 'TIME_SERIES_DAILY',
      symbol,
      outputsize: 'compact',
      apikey: getApiKeys().alphavantage
    });
  }
};

/**
 * Servicios para divisas (Exchange Rate API)
 */
export const forexService = {
  baseUrl: API_URLS.forex.primary,
  
  // Obtener tipos de cambio actuales
  getExchangeRates: async (base = 'USD') => {
    // Verificar si hay una clave API configurada
    const hasApiKey = getApiKey('exchangerate', process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '');
    
    if (!hasApiKey) {
      console.warn('Sin clave API de Exchange Rate configurada. Usando datos de fallback.');
      // Retornar datos de fallback en formato compatible
      return {
        base: base.toUpperCase(),
        rates: { ...fallbackData.forex.rates }
      };
    }
    
    try {
      // Intentar con la URL principal
      try {
        // Añadir el endpoint "/latest/BASE" a la URL base
        const endpoint = `/latest/${base}`;
        const response = await fetchWithRetry(API_URLS.forex, endpoint, {});
        
        // Adaptar al nuevo formato de respuesta de la API
        if (response && response.conversion_rates) {
          return {
            rates: response.conversion_rates,
            base: response.base_code
          };
        }
        
        return response;
      } catch (mainError) {
        console.error('Error con URL principal de Exchange Rate API:', mainError);
        
        // Si es un error 404, intentar URLs alternativas
        if (mainError.response && mainError.response.status === 404) {
          console.warn('Probando URLs alternativas para Exchange Rate API...');
          
          // Intentar con cada URL de respaldo
          for (const backupUrl of API_URLS.forex.backupUrls) {
            try {
              let fullUrl = backupUrl;
              
              // Ajustar la URL según la versión de la API
              if (backupUrl.includes('v6.exchangerate-api.com')) {
                fullUrl = `${backupUrl}/latest/${base}`;
              } else if (backupUrl.includes('api.exchangerate-api.com/v4')) {
                fullUrl = `${backupUrl}/latest/${base}`;
              } else if (backupUrl.includes('open.er-api.com')) {
                // Este es un servicio gratuito alternativo que no requiere clave API
                fullUrl = `${backupUrl}/${base}`;
              }
              
              console.log(`Intentando con URL alternativa: ${fullUrl}`);
              const response = await axios.get(fullUrl, {
                timeout: 15000
              });
              
              if (response.data) {
                // Adaptar formato de respuesta según la versión de la API
                if (response.data.conversion_rates) {
                  return {
                    rates: response.data.conversion_rates,
                    base: response.data.base_code
                  };
                } else if (response.data.rates) {
                  return {
                    rates: response.data.rates,
                    base: response.data.base
                  };
                } else if (response.data.base_code) {
                  // Formato alternativo
                  return {
                    rates: response.data.conversion_rates || response.data.rates,
                    base: response.data.base_code || response.data.base
                  };
                }
              }
            } catch (backupError) {
              console.error(`Error con URL alternativa: ${backupUrl}`, backupError);
              // Continuar con la siguiente URL de respaldo
            }
          }
        }
        
        // Si todos los intentos fallan, lanzar el error original
        throw mainError;
      }
    } catch (error) {
      console.error('Error al obtener tasas de cambio:', error);
      console.warn('Usando datos de fallback para tasas de cambio');
      
      // Retornar datos de fallback en caso de error
      return {
        base: base.toUpperCase(),
        rates: { ...fallbackData.forex.rates }
      };
    }
  },
  
  // Convertir una moneda a otra
  convertCurrency: async (from, to, amount) => {
    try {
      const rates = await forexService.getExchangeRates(from);
      if (rates && rates.rates && rates.rates[to]) {
        return {
          result: amount * rates.rates[to],
          rate: rates.rates[to]
        };
      }
      throw new Error(`No se pudo convertir de ${from} a ${to}`);
    } catch (error) {
      console.error('Error en conversión de moneda:', error);
      console.warn('Usando datos de fallback para conversión');
      
      // Usar fallback para conversión
      const convertedAmount = fallbackData.forex.convert(from, to, amount);
      return {
        result: convertedAmount,
        rate: fallbackData.forex.rates[to] / fallbackData.forex.rates[from]
      };
    }
  },
  
  // Obtener lista de monedas disponibles
  getCurrencies: async () => {
    try {
      const rates = await forexService.getExchangeRates('USD');
      if (rates && rates.rates) {
        return Object.keys(rates.rates).map(code => ({
          code,
          name: getCurrencyName(code)
        }));
      }
      throw new Error('No se pudieron obtener divisas');
    } catch (error) {
      console.error('Error al obtener lista de divisas:', error);
      console.warn('Usando datos de fallback para lista de divisas');
      
      // Usar fallback para lista de divisas
      return Object.keys(fallbackData.forex.rates).map(code => ({
        code,
        name: getCurrencyName(code)
      }));
    }
  }
};

/**
 * Obtener el nombre de una moneda a partir de su código
 */
function getCurrencyName(code) {
  const currencyNames = {
    USD: 'Dólar estadounidense',
    EUR: 'Euro',
    JPY: 'Yen japonés',
    GBP: 'Libra esterlina',
    AUD: 'Dólar australiano',
    CAD: 'Dólar canadiense',
    CHF: 'Franco suizo',
    CNY: 'Yuan chino',
    MXN: 'Peso mexicano',
    BRL: 'Real brasileño',
    // Añadir más si es necesario
  };
  
  return currencyNames[code] || code;
}

/**
 * Datos de fallback para cuando las APIs no están disponibles
 */
export const fallbackData = {
  // Datos de criptomonedas de fallback
  crypto: {
    coins: [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 38245.32 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 2345.67 },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0.5634 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 0.4876 },
      { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 142.56 }
    ],
    
    getPrices: (coinIds) => {
      const prices = {};
      const basePrices = {
        bitcoin: { usd: 38245.32, mxn: 38245.32 * 17.5 },
        ethereum: { usd: 2345.67, mxn: 2345.67 * 17.5 },
        ripple: { usd: 0.5634, mxn: 0.5634 * 17.5 },
        cardano: { usd: 0.4876, mxn: 0.4876 * 17.5 },
        solana: { usd: 142.56, mxn: 142.56 * 17.5 }
      };
      
      coinIds.forEach(id => {
        if (basePrices[id]) {
          prices[id] = basePrices[id];
        } else {
          const randomPrice = (Math.random() * 100).toFixed(2);
          prices[id] = {
            usd: parseFloat(randomPrice),
            mxn: parseFloat(randomPrice) * 17.5
          };
        }
      });
      
      return prices;
    }
  },
  
  // Datos de acciones de fallback
  stock: {
    search: [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', region: 'United States' }
    ],
    
    quotes: {
      'AAPL': { price: 175.34, change: 1.23, changePercent: 0.71 },
      'MSFT': { price: 338.47, change: -0.67, changePercent: -0.20 },
      'GOOGL': { price: 125.23, change: 2.14, changePercent: 1.74 },
      'AMZN': { price: 139.56, change: 3.45, changePercent: 2.54 },
      'TSLA': { price: 238.72, change: -5.32, changePercent: -2.18 }
    },
    
    getQuote: (symbol) => {
      const quotes = fallbackData.stock.quotes;
      if (quotes[symbol]) {
        return quotes[symbol];
      }
      
      // Generar datos aleatorios para símbolos desconocidos
      const price = (Math.random() * 200 + 50).toFixed(2);
      const change = (Math.random() * 10 - 5).toFixed(2);
      const changePercent = (change / price * 100).toFixed(2);
      
      return {
        price: parseFloat(price),
        change: parseFloat(change),
        changePercent: parseFloat(changePercent)
      };
    }
  },
  
  // Datos de divisas de fallback
  forex: {
    rates: {
      USD: 1.0,
      EUR: 0.92,
      JPY: 151.67,
      GBP: 0.79,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.91,
      CNY: 7.24,
      MXN: 17.5,
      BRL: 5.07
    },
    
    convert: (from, to, amount) => {
      const rates = fallbackData.forex.rates;
      // Convertir primero a USD
      const amountInUSD = amount / (rates[from] || 1);
      // Luego convertir de USD a la moneda destino
      return amountInUSD * (rates[to] || 1);
    }
  }
}; 