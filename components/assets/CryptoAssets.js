import { useState, useEffect } from 'react';
import { 
  Autocomplete, TextField, Alert, Skeleton, 
  Box, Avatar, Typography
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { cryptoService, fallbackData } from '../../utils/apiServices';
import { getCacheTimeRemaining, hasCacheData, generateCacheKey } from '../../utils/cacheService';

const CryptoAssets = ({ 
  onSymbolChange, 
  usingFallbackData,
  setErrorMessage,
  setUsingFallbackData
}) => {
  const [coinList, setCoinList] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState(0);

  // Verificar el estado de la caché para criptomonedas
  const checkCacheStatus = () => {
    // Comprobamos la caché para lista de monedas
    const cacheKey = generateCacheKey(`${cryptoService.baseUrl}/coins/markets`, {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250,
      page: 1,
      sparkline: false
    });
    
    const hasCache = hasCacheData(cacheKey);
    setUsingCachedData(hasCache);
    
    if (hasCache) {
      setCacheTimeRemaining(getCacheTimeRemaining(cacheKey));
    }
  };

  // Cargar lista de criptomonedas al iniciar
  useEffect(() => {
    let isMounted = true;
    let retryTimeoutId;

    async function fetchCoinList() {
      if (!isMounted) return;
      
      setLoadingCoins(true);
      checkCacheStatus();
      
      try {
        // Usar el servicio de API de criptomonedas
        const data = await cryptoService.getCoins();
        
        if (isMounted) {
          setCoinList(data);
          setErrorMessage('');
          setLoadingCoins(false);
          setUsingFallbackData(false);
          checkCacheStatus();
        }
      } catch (err) {
        console.error('Error al cargar lista de criptomonedas', err);
        if (isMounted) {
          // Usar datos de fallback
          setCoinList(fallbackData.crypto.coins);
          setUsingFallbackData(true);
          setErrorMessage('Usando datos de ejemplo. CoinGecko API no está disponible en este momento.');
          setLoadingCoins(false);
          
          // Intentar nuevamente después de 30 segundos
          retryTimeoutId = setTimeout(() => {
            if (isMounted) fetchCoinList();
          }, 30000);
        }
      }
    }
    
    fetchCoinList();
    
    // Actualizar el tiempo restante de caché cada minuto
    const cacheTimerId = setInterval(() => {
      if (isMounted) {
        checkCacheStatus();
      }
    }, 60000);
    
    // Limpieza al desmontar
    return () => {
      isMounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      clearInterval(cacheTimerId);
    };
  }, [setErrorMessage, setUsingFallbackData]);

  // Obtener lista de criptomonedas filtrada
  const getCryptoOptions = () => {
    if (coinList.length === 0) return [];
    
    return coinList.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image
    }));
  };

  return (
    <>
      {loadingCoins ? (
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ my: 2 }} />
      ) : coinList.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ my: 2 }}
          icon={<HourglassEmptyIcon />}
        >
          Esperando a CoinGecko... Los datos de criptomonedas no están disponibles actualmente.
        </Alert>
      ) : (
        <Autocomplete
          options={getCryptoOptions()}
          getOptionLabel={(option) => `${option.name} (${option.symbol})`}
          onChange={onSymbolChange}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={option.image} alt={option.name} sx={{ width: 24, height: 24, mr: 1 }} />
              {option.name} ({option.symbol})
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Seleccionar Criptomoneda"
              margin="normal"
              fullWidth
              required
            />
          )}
        />
      )}
      
      {usingFallbackData && (
        <Alert 
          severity="info" 
          sx={{ mt: 1 }}
          icon={<InfoIcon />}
        >
          Usando datos de ejemplo de CoinGecko. Los precios no son en tiempo real.
        </Alert>
      )}
    </>
  );
};

export default CryptoAssets; 