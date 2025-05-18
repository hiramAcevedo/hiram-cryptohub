import { useState, useEffect } from 'react';
import { 
  Autocomplete, TextField, Alert, Skeleton, 
  Box, Avatar, Typography, CircularProgress,
  Paper
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CachedIcon from '@mui/icons-material/Cached';
import ErrorIcon from '@mui/icons-material/Error';
import { stockService, fallbackData } from '../../utils/apiServices';
import { getCacheTimeRemaining, hasCacheData, generateCacheKey } from '../../utils/cacheService';

const StockAssets = ({ 
  onSymbolChange, 
  loadingPrice, 
  usingFallbackData,
  setErrorMessage,
  setUsingFallbackData
}) => {
  const [stockList, setStockList] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState(0);

  // Lista ampliada de acciones populares con datos completos
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.34, change: 1.23, changePercent: 0.71, sector: 'Technology', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 338.47, change: -0.67, changePercent: -0.20, sector: 'Technology', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2048px-Microsoft_logo.svg.png' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 125.23, change: 2.14, changePercent: 1.74, sector: 'Technology', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 139.56, change: 3.45, changePercent: 2.54, sector: 'Consumer Cyclical', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 238.72, change: -5.32, changePercent: -2.18, sector: 'Automotive', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tesla_logo.png/800px-Tesla_logo.png' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', price: 327.56, change: 4.28, changePercent: 1.32, sector: 'Technology', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/799px-Meta_Platforms_Inc._logo.svg.png' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 437.82, change: 12.67, changePercent: 2.98, sector: 'Technology', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/2560px-Nvidia_logo.svg.png' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 182.34, change: -0.45, changePercent: -0.25, sector: 'Financial Services', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/J_P_Morgan_Logo_2008_1.svg/1280px-J_P_Morgan_Logo_2008_1.svg.png' },
    { symbol: 'V', name: 'Visa Inc.', price: 267.23, change: 1.56, changePercent: 0.59, sector: 'Financial Services', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png' },
    { symbol: 'WMT', name: 'Walmart Inc.', price: 59.87, change: 0.32, changePercent: 0.54, sector: 'Consumer Defensive', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/1280px-Walmart_logo.svg.png' },
    { symbol: 'KO', name: 'The Coca-Cola Company', price: 61.42, change: 0.18, changePercent: 0.29, sector: 'Consumer Defensive', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/1280px-Coca-Cola_logo.svg.png' },
    { symbol: 'PG', name: 'Procter & Gamble', price: 162.80, change: 1.10, changePercent: 0.68, sector: 'Consumer Defensive', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Procter_%26_Gamble_logo.svg/1024px-Procter_%26_Gamble_logo.svg.png' },
    { symbol: 'DIS', name: 'The Walt Disney Company', price: 102.56, change: -0.87, changePercent: -0.84, sector: 'Communication Services', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Walt_Disney_Studios_logo.svg/2560px-Walt_Disney_Studios_logo.svg.png' }
  ];

  // Verificar el estado de la caché para los datos de acciones
  const checkCacheStatus = () => {
    // Comprobamos si hay datos en caché para MSFT como referencia
    const cacheKey = generateCacheKey(`${stockService.baseUrl}`, {
      function: 'GLOBAL_QUOTE',
      symbol: 'MSFT',
      apikey: 'demo'
    });
    
    const hasCache = hasCacheData(cacheKey);
    setUsingCachedData(hasCache);
    
    if (hasCache) {
      setCacheTimeRemaining(getCacheTimeRemaining(cacheKey));
    }
  };

  // Cargar acciones populares
  useEffect(() => {
    let isMounted = true;
    
    async function fetchPopularStocks() {
      if (!isMounted) return;
      
      setLoadingStocks(true);
      checkCacheStatus();

      try {
        // Intentar una sola llamada a la API para ver si está funcionando
        const quote = await stockService.getStockQuote('MSFT');
        
        if (quote && quote['Global Quote'] && Object.keys(quote['Global Quote']).length > 0) {
          // Si la API está funcionando, usamos la lista predefinida pero intentamos obtener precios reales
          setErrorMessage('');
          
          // Usamos nuestra lista preconfigurada de acciones populares
          setStockList([...popularStocks]);
          
          // No intentamos cargar todos los precios por los límites de la API
          setUsingFallbackData(false);
        } else {
          // Si la API devuelve un formato inesperado o datos vacíos
          setStockList([...popularStocks]);
          setErrorMessage('Usando datos de ejemplo para acciones. Se requiere una API de pago para datos en tiempo real.');
          setUsingFallbackData(true);
        }
      } catch (err) {
        console.error('Error al cargar acciones populares', err);
        
        // Usar siempre nuestros datos predefinidos en caso de error
        setStockList([...popularStocks]);
        setErrorMessage('Usando datos de ejemplo para acciones. Alpha Vantage API requiere una suscripción de pago para uso continuo.');
        setUsingFallbackData(true);
      } finally {
        if (isMounted) {
          setLoadingStocks(false);
        }
      }
    }
    
    fetchPopularStocks();
    
    // Actualizar el tiempo restante de caché cada minuto
    const cacheTimerId = setInterval(() => {
      if (isMounted) {
        checkCacheStatus();
      }
    }, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(cacheTimerId);
    };
  }, [setErrorMessage]);

  return (
    <>
      <Alert 
        severity="warning" 
        sx={{ mb: 2 }}
        icon={<ErrorIcon />}
      >
        Alpha Vantage API requiere una clave de pago para uso continuo. Estamos usando datos de ejemplo.
      </Alert>
      
      {loadingStocks ? (
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ my: 2 }} />
      ) : stockList.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ my: 2 }}
          icon={<HourglassEmptyIcon />}
        >
          Esperando datos de acciones... No están disponibles actualmente.
        </Alert>
      ) : (
        <Autocomplete
          options={stockList}
          getOptionLabel={(option) => `${option.name} (${option.symbol})`}
          onChange={onSymbolChange}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
              {option.logo && (
                <img 
                  src={option.logo} 
                  alt="" 
                  style={{ width: 20, height: 20, marginRight: 8, objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">{option.name} ({option.symbol})</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.sector}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2">${option.price.toFixed(2)}</Typography>
                <Typography 
                  variant="caption" 
                  color={option.change >= 0 ? 'success.main' : 'error.main'}
                >
                  {option.change >= 0 ? '+' : ''}{option.change.toFixed(2)} ({option.change >= 0 ? '+' : ''}{option.changePercent.toFixed(2)}%)
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Acción"
              margin="normal"
              fullWidth
              required
            />
          )}
        />
      )}
      
      {usingCachedData && (
        <Alert 
          severity="success" 
          sx={{ mt: 1 }}
          icon={<CachedIcon />}
        >
          Usando datos en caché. Tiempo restante: {cacheTimeRemaining} minutos.
        </Alert>
      )}
      
      {usingFallbackData && (
        <Alert 
          severity="info" 
          sx={{ mt: 1 }}
          icon={<InfoIcon />}
        >
          Usando datos de ejemplo. Los precios no son en tiempo real. Para datos actualizados, se requiere una API de pago.
        </Alert>
      )}
    </>
  );
};

export default StockAssets; 