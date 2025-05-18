import { useState, useEffect } from 'react';
import { 
  Autocomplete, TextField, Alert, Skeleton, 
  Box, Avatar, Typography, Chip, Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CachedIcon from '@mui/icons-material/Cached';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import { forexService, fallbackData } from '../../utils/apiServices';
import { getCacheTimeRemaining, hasCacheData, generateCacheKey } from '../../utils/cacheService';

// Función para obtener la URL de la bandera según el código ISO de la moneda
const getFlagUrl = (code) => {
  // Convertir código de moneda a código ISO de país (para la mayoría de monedas)
  // Esto es una simplificación, no funciona para todas las monedas
  const countryCode = code.substring(0, 2).toLowerCase();
  return `https://flagcdn.com/w20/${countryCode}.png`;
};

// Información adicional sobre divisas populares
const currencyDetails = {
  USD: { name: 'Dólar estadounidense', countryCode: 'us', symbol: '$' },
  EUR: { name: 'Euro', countryCode: 'eu', symbol: '€' },
  GBP: { name: 'Libra esterlina', countryCode: 'gb', symbol: '£' },
  JPY: { name: 'Yen japonés', countryCode: 'jp', symbol: '¥' },
  CAD: { name: 'Dólar canadiense', countryCode: 'ca', symbol: 'C$' },
  AUD: { name: 'Dólar australiano', countryCode: 'au', symbol: 'A$' },
  CHF: { name: 'Franco suizo', countryCode: 'ch', symbol: 'Fr' },
  CNY: { name: 'Yuan chino', countryCode: 'cn', symbol: '¥' },
  MXN: { name: 'Peso mexicano', countryCode: 'mx', symbol: '$' },
  BRL: { name: 'Real brasileño', countryCode: 'br', symbol: 'R$' },
  INR: { name: 'Rupia india', countryCode: 'in', symbol: '₹' },
  RUB: { name: 'Rublo ruso', countryCode: 'ru', symbol: '₽' },
  KRW: { name: 'Won surcoreano', countryCode: 'kr', symbol: '₩' },
};

const ForexAssets = ({ 
  onSymbolChange, 
  loadingPrice, 
  usingFallbackData,
  setErrorMessage,
  setUsingFallbackData
}) => {
  const [currencyList, setCurrencyList] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheTimeRemaining, setCacheTimeRemaining] = useState(0);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);

  // Verificar el estado de la caché para tipos de cambio
  const checkCacheStatus = () => {
    // Comprobamos la caché para un tipo de cambio con base USD
    const cacheKey = generateCacheKey(`${forexService.baseUrl}`, { base: 'USD' });
    
    const hasCache = hasCacheData(cacheKey);
    setUsingCachedData(hasCache);
    
    if (hasCache) {
      setCacheTimeRemaining(getCacheTimeRemaining(cacheKey));
    }
  };

  // Cargar lista de divisas al iniciar
  useEffect(() => {
    let isMounted = true;
    let retryTimeoutId;

    async function fetchCurrenciesList() {
      if (!isMounted) return;
      
      setLoadingCurrencies(true);
      checkCacheStatus();
      
      try {
        // Usar el servicio de API de divisas
        const currencies = await forexService.getCurrencies();
        const rates = await forexService.getExchangeRates('USD');
        
        if (isMounted) {
          if (rates && rates.rates) {
            setExchangeRates(rates.rates);
          }
          
          // Enriquecer los datos de divisas con información adicional
          const enhancedCurrencies = currencies.map(currency => {
            const detail = currencyDetails[currency.code] || {};
            const rate = rates?.rates?.[currency.code] || null;
            
            return {
              ...currency,
              countryCode: detail.countryCode || currency.code.substring(0, 2).toLowerCase(),
              symbol: detail.symbol || '',
              rate: rate
            };
          });
          
          // Priorizar las divisas más comunes
          const priorityCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'MXN', 'BRL'];
          
          // Ordenar divisas: primero las populares, luego por código
          enhancedCurrencies.sort((a, b) => {
            const indexA = priorityCodes.indexOf(a.code);
            const indexB = priorityCodes.indexOf(b.code);
            
            if (indexA >= 0 && indexB >= 0) return indexA - indexB;
            if (indexA >= 0) return -1;
            if (indexB >= 0) return 1;
            return a.code.localeCompare(b.code);
          });
          
          setCurrencyList(enhancedCurrencies);
          setErrorMessage('');
          setLoadingCurrencies(false);
          setUsingFallbackData(false);
          checkCacheStatus();
        }
      } catch (err) {
        console.error('Error al cargar lista de divisas', err);
        
        if (isMounted) {
          // Crear lista de divisas de fallback
          const fallbackCurrencies = Object.keys(fallbackData.forex.rates).map(code => {
            const detail = currencyDetails[code] || {};
            return {
              code,
              name: detail.name || getCurrencyName(code),
              countryCode: detail.countryCode || code.substring(0, 2).toLowerCase(),
              symbol: detail.symbol || '',
              rate: fallbackData.forex.rates[code]
            };
          });
          
          // Ordenar igual que las reales
          const priorityCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'MXN', 'BRL'];
          fallbackCurrencies.sort((a, b) => {
            const indexA = priorityCodes.indexOf(a.code);
            const indexB = priorityCodes.indexOf(b.code);
            
            if (indexA >= 0 && indexB >= 0) return indexA - indexB;
            if (indexA >= 0) return -1;
            if (indexB >= 0) return 1;
            return a.code.localeCompare(b.code);
          });
          
          setCurrencyList(fallbackCurrencies);
          setExchangeRates(fallbackData.forex.rates);
          setErrorMessage('Usando datos de ejemplo. La API de tipos de cambio no está disponible.');
          setLoadingCurrencies(false);
          setUsingFallbackData(true);
          
          // Intentar nuevamente después de un minuto
          retryTimeoutId = setTimeout(() => {
            if (isMounted) fetchCurrenciesList();
          }, 60000);
        }
      }
    }
    
    fetchCurrenciesList();
    
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
  }, [setErrorMessage]);

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

  return (
    <>
      {loadingCurrencies ? (
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ my: 2 }} />
      ) : currencyList.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ my: 2 }}
          icon={<HourglassEmptyIcon />}
        >
          Esperando datos de divisas... No están disponibles actualmente.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              <CurrencyExchangeIcon sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1rem' }} />
              Selecciona una divisa popular:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {['EUR', 'GBP', 'JPY', 'CAD', 'MXN'].map(code => {
                const rate = exchangeRates ? exchangeRates[code] : null;
                if (!rate) return null;
                
                // Encontrar la divisa completa en la lista para pasarla al onChange
                const currencyOption = currencyList.find(currency => currency.code === code);
                
                return (
                  <Tooltip 
                    key={code}
                    title={`Seleccionar ${getCurrencyName(code)}`}
                    arrow
                  >
                    <Chip 
                      label={`${code}: ${rate.toFixed(4)}`}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        if (currencyOption) {
                          setSelectedCurrency(currencyOption);
                          onSymbolChange(null, currencyOption);
                        }
                      }}
                      sx={{ 
                        cursor: 'pointer',
                        bgcolor: selectedCurrency?.code === code ? 'primary.light' : 'transparent',
                        color: selectedCurrency?.code === code ? 'primary.contrastText' : 'inherit',
                        borderColor: selectedCurrency?.code === code ? 'primary.main' : 'inherit',
                        fontWeight: selectedCurrency?.code === code ? 'bold' : 'normal',
                        '&:hover': { 
                          bgcolor: 'primary.light', 
                          color: 'primary.contrastText',
                          borderColor: 'primary.main'
                        }
                      }}
                      avatar={
                        <Avatar 
                          alt={code} 
                          src={`https://flagcdn.com/w20/${(currencyDetails[code]?.countryCode || code.substring(0, 2).toLowerCase())}.png`}
                          sx={{ width: 20, height: 20 }}
                        />
                      }
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
          
          <Autocomplete
            options={currencyList}
            getOptionLabel={(option) => `${option.name} (${option.code})`}
            onChange={(event, newValue) => {
              setSelectedCurrency(newValue);
              onSymbolChange(event, newValue);
            }}
            value={selectedCurrency}
            isOptionEqualToValue={(option, value) => option.code === value.code}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={`https://flagcdn.com/w20/${option.countryCode}.png`}
                  alt="" 
                  style={{ width: 20, marginRight: 8 }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">{option.name} ({option.code})</Typography>
                  {option.symbol && (
                    <Typography variant="caption" color="text.secondary">
                      Símbolo: {option.symbol}
                    </Typography>
                  )}
                </Box>
                {option.rate && option.code !== 'USD' && (
                  <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
                    1 USD = {option.rate.toFixed(4)} {option.code}
                  </Typography>
                )}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.code})` : "Seleccionar Divisa"}
                margin="normal"
                fullWidth
                error={false}
              />
            )}
          />
        </>
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
          Usando datos de ejemplo. Los tipos de cambio pueden no ser actuales.
        </Alert>
      )}
    </>
  );
};

export default ForexAssets; 