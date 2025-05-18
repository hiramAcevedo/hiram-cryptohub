// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography,
  TextField, Button, Autocomplete, Avatar, MenuItem, Paper,
  Alert, Skeleton, CircularProgress, Divider, AppBar, Toolbar
} from '@mui/material';
import { useWatchlist } from '../store/useWatchlist';
import { useAuth } from '../store/AuthContext';
import { useInvestments } from '../store/useInvestments';
import CoinCard from '../components/CoinCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoIcon from '@mui/icons-material/Info';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { formatAmount } from '../utils/formatCurrency';
import { fallbackCoinList, generateFallbackPrices } from '../utils/fallbackData';

// URL Base de la API, con alternativas en caso de fallo
const API_URLS = {
  primary: 'https://api.coingecko.com/api/v3',
  // Usar un proxy público como alternativa (esto es un ejemplo y puede no funcionar)
  proxy: 'https://corsproxy.io/?https://api.coingecko.com/api/v3'
};

// Función para realizar solicitudes a la API con reintentos
const fetchWithRetry = async (endpoint, params, maxRetries = 2) => {
  let lastError;
  let currentTry = 0;
  
  // Intentar con la URL principal primero
  while (currentTry <= maxRetries) {
    try {
      const baseUrl = currentTry === 0 ? API_URLS.primary : API_URLS.proxy;
      const url = `${baseUrl}${endpoint}`;
      console.log(`Intento ${currentTry+1}: Conectando a ${url}`);
      
      const response = await axios.get(url, {
        params,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error en intento ${currentTry+1}:`, error.message);
      lastError = error;
      currentTry++;
      
      // Esperar un poco antes de reintentar
      if (currentTry <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
};

export default function Home() {
  // Estado global
  const { coins, addCoin, removeCoin } = useWatchlist();
  const { balance } = useInvestments();

  // Lista de todas las monedas para Autocomplete
  const [coinOptions, setCoinOptions] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Precios (usd y mxn)
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Estado para indicar si estamos usando datos de fallback
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Posibles errores
  const [error, setError] = useState('');

  // Estado para las divisas
  const [currency, setCurrency] = useState('usd'); 

  const [convertCoin, setConvertCoin] = useState('');

  const [convertAmount, setConvertAmount] = useState('');


  // 1) Cargar lista de monedas al montar
  useEffect(() => {
    let isMounted = true;
    let retryTimeoutId;

    async function fetchCoinList() {
      if (!isMounted) return;

      setLoadingCoins(true);
      try {
        // Usar la función fetchWithRetry en lugar de axios.get directamente
        const data = await fetchWithRetry('/coins/markets', {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: 250,
              page: 1,
              sparkline: false,
        });
        
        if (isMounted) {
          setCoinOptions(data);
          setLoadingCoins(false);
          setUsingFallbackData(false);
        }
      } catch (err) {
        console.error('Error fetching coin list', err);
        if (isMounted) {
          // Usar datos de fallback
          setCoinOptions(fallbackCoinList);
          setUsingFallbackData(true);
          setError('Usando datos de ejemplo. CoinGecko API no está disponible en este momento.');
          setLoadingCoins(false);
          
          // Intentar nuevamente después de 30 segundos
          retryTimeoutId = setTimeout(() => {
            if (isMounted) fetchCoinList();
          }, 30000);
        }
      }
    }
    fetchCoinList();
    
    // Limpieza al desmontar
    return () => {
      isMounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);

  // 2) Cargar precios cada vez que cambie `coins`, y repetir cada minuto
  useEffect(() => {
    let intervalId;
    let isMounted = true;

    async function fetchPrices() {
      if (!coins.length) return;
      
      setLoadingPrices(true);
      try {
        setError(usingFallbackData ? 'Usando datos de ejemplo. CoinGecko API no está disponible en este momento.' : '');
        const ids = coins.join(',');
        
        // Usar la función fetchWithRetry en lugar de axios.get directamente
        const data = await fetchWithRetry('/simple/price', {
              ids,
              vs_currencies: 'usd,mxn',
        });
        
        if (isMounted) {
          setPrices(data);
          setLoadingPrices(false);
          setUsingFallbackData(false);
        }
      } catch (err) {
        console.error('Error fetching prices', err);
        if (isMounted) {
          // Usar precios de fallback
          setPrices(generateFallbackPrices(coins));
          setUsingFallbackData(true);
          setError('Usando datos de ejemplo. CoinGecko API no está disponible en este momento.');
          setLoadingPrices(false);
        }
      }
    }

    fetchPrices();
    intervalId = setInterval(fetchPrices, 60_000); // 60 s
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [coins, usingFallbackData]);

  // Obtener información del usuario
  const { user, logout } = useAuth();

  return (
    <>
      {/* Barra superior con navegación */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
        Hiram CryptoHub
      </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              variant="contained"
              color="primary"
              href="/investments"
              startIcon={<DashboardIcon />}
            >
              Gestión de Inversiones
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                Hola, {user?.name || 'Usuario'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={logout}
                endIcon={<LogoutIcon />}
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container sx={{ py: 4 }}>
        {/* Panel de saldo destacado */}
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 4, 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            background: 'linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05))',
            borderLeft: '4px solid #4caf50'
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Saldo disponible
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {formatAmount(balance)}
            </Typography>
          </Box>
        </Paper>

        {error && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            icon={<InfoIcon />}
          >
            {error}
          </Alert>
        )}

      {/* Autocomplete de búsqueda */}
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
          {loadingCoins ? (
            <Skeleton variant="rectangular" width={300} height={56} sx={{ mr: 2 }} />
          ) : (
        <Autocomplete
          sx={{ width: 300, mr: 2 }}
          options={coinOptions}
          getOptionLabel={(option) => option.name}
          onChange={(e, option) => option && addCoin(option.id)}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={option.image} alt={option.name} sx={{ width: 24, height: 24, mr: 1 }} />
              {option.name} ({option.symbol.toUpperCase()})
            </Box>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Buscar criptomoneda" variant="outlined" />
          )}
        />
          )}
        <Typography variant="body2" color="text.secondary">
          🔍 Selecciona para añadir a tu lista
        </Typography>
      </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <TextField
          select
          label="Divisa"
          size="small"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          sx={{ width: 120 }}
        >
          <MenuItem value="usd">USD</MenuItem>
          <MenuItem value="mxn">MXN</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary">
          Elige la divisa para todas las tarjetas
        </Typography>
      </Box>
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tus Criptomonedas
        </Typography>

      {/* Tarjetas con precios */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {loadingPrices && coins.length > 0 && Object.keys(prices).length === 0 ? (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            coins.map((id) => (
          <CoinCard
            key={id}
            id={id}
            currency={currency}
            price={prices}
            image={coinOptions.find((c) => c.id === id)?.image}
            onRemove={removeCoin}
          />
            ))
          )}
          {coins.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', p: 3 }}>
              <Typography color="text.secondary">
                No hay criptomonedas en tu lista. Busca y añade alguna arriba.
              </Typography>
            </Box>
          )}
      </Box>

      <Box sx={{ mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Conversor
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Autocomplete
            sx={{ width: 200 }}
            options={coins.map((id) => ({
              id,
              name: coinOptions.find((c) => c.id === id)?.name || id,
            }))}
            getOptionLabel={(opt) => opt.name}
            onChange={(e, opt) => setConvertCoin(opt?.id || '')}
            renderInput={(params) => (
              <TextField {...params} label="Elige moneda" size="small" />
            )}
          />
          <TextField
            label="Cantidad"
            type="number"
            size="small"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
            sx={{ width: 100 }}
          />
          <Typography>
            ={' '}
            {convertCoin && convertAmount
                ? `${formatAmount(convertAmount * (prices[convertCoin]?.[currency] || 0), currency.toUpperCase())}`
              : '–'}
          </Typography>
        </Box>
      </Box>

        {usingFallbackData && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid #4caf50' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
              Modo Demo Activo
            </Typography>
            <Typography variant="body2">
              La aplicación está funcionando con datos de ejemplo porque la API de CoinGecko no está disponible.
              Los precios mostrados son aproximados y no representan valores reales del mercado.
            </Typography>
          </Box>
        )}
    </Container>
    </>
  );
}
