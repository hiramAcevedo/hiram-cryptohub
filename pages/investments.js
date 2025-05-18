import { useState, useEffect } from 'react';
import { useInvestments } from '../store/useInvestments';
import { useAuth } from '../store/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import {
  Container, Box, Typography, TextField, Button, 
  Autocomplete, Avatar, Paper, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, MenuItem, Grid, Card,
  CardContent, CardActions, Chip, Tooltip, InputAdornment,
  Skeleton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { formatAmount, formatCurrency, parseFormattedNumber } from '../utils/formatCurrency';
import { cryptoService, stockService, forexService, fallbackData } from '../utils/apiServices';
import InfoIcon from '@mui/icons-material/Info';

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

// Importar componentes
import PortfolioCard from '../components/portfolio/PortfolioCard';
import PortfolioForm from '../components/forms/PortfolioForm';
import AssetForm from '../components/forms/AssetForm';

export default function Investments() {
  const { 
    balance, 
    portfolios, 
    addPortfolio, 
    removePortfolio, 
    updatePortfolio,
    addAsset,
    removeAsset,
    updateBalance
  } = useInvestments();

  const [newPortfolio, setNewPortfolio] = useState({ name: '', description: '' });
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [newAsset, setNewAsset] = useState({ 
    type: 'crypto', 
    symbol: '', 
    amount: 0, 
    purchasePrice: 0 
  });
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [coinList, setCoinList] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, logout } = useAuth();

  // Nuevo estado para el input formateado
  const [formattedInvestmentAmount, setFormattedInvestmentAmount] = useState('');

  const [loadingCoins, setLoadingCoins] = useState(true);

  // Estado para indicar si estamos usando datos de fallback
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Estado para los datos de acciones y divisas
  const [stockList, setStockList] = useState([]);
  const [forexList, setForexList] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingForex, setLoadingForex] = useState(false);

  const [coinImages, setCoinImages] = useState({});

  // Cargar lista de criptomonedas al iniciar
  useEffect(() => {
    let isMounted = true;
    let retryTimeoutId;

    async function fetchCoinList() {
      if (!isMounted) return;
      
      setLoadingCoins(true);
      try {
        // Usar el servicio de API de criptomonedas
        const data = await cryptoService.getCoins();
        
        if (isMounted) {
          setCoinList(data);
          setErrorMessage('');
          setLoadingCoins(false);
          setUsingFallbackData(false);
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
    
    // Limpieza al desmontar
    return () => {
      isMounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, []);
  
  // Cargar acciones populares
  useEffect(() => {
    let isMounted = true;
    
    async function fetchPopularStocks() {
      if (!isMounted) return;
      
      setLoadingStocks(true);
      try {
        // Buscar acciones populares
        const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        const stocks = [];
        
        for (const symbol of popularSymbols) {
          try {
            const quote = await stockService.getStockQuote(symbol);
            if (quote && quote['Global Quote']) {
              const data = quote['Global Quote'];
              stocks.push({
                symbol,
                name: getStockName(symbol),
                price: parseFloat(data['05. price']),
                change: parseFloat(data['09. change']),
                changePercent: parseFloat(data['10. change percent'].replace('%', ''))
              });
            }
          } catch (error) {
            console.error(`Error obteniendo datos para ${symbol}:`, error);
          }
        }
        
        if (isMounted) {
          if (stocks.length > 0) {
            setStockList(stocks);
            setUsingFallbackData(false);
          } else {
            // Usar datos de fallback si no se pudo obtener ninguna acción
            setStockList(fallbackData.stock.search);
            setUsingFallbackData(true);
          }
          setLoadingStocks(false);
        }
      } catch (err) {
        console.error('Error al cargar acciones populares', err);
        if (isMounted) {
          setStockList(fallbackData.stock.search);
          setUsingFallbackData(true);
          setLoadingStocks(false);
        }
      }
    }
    
    fetchPopularStocks();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Cargar divisas disponibles
  useEffect(() => {
    let isMounted = true;
    
    async function fetchForexList() {
      if (!isMounted) return;
      
      setLoadingForex(true);
      try {
        const currencies = await forexService.getCurrencies();
        
        if (isMounted) {
          if (currencies && currencies.length > 0) {
            setForexList(currencies);
            setUsingFallbackData(false);
          } else {
            // Usar datos de fallback si no se pudieron obtener divisas
            setForexList(Object.keys(fallbackData.forex.rates).map(code => ({
              code,
              name: getCurrencyName(code)
            })));
            setUsingFallbackData(true);
          }
          setLoadingForex(false);
        }
      } catch (err) {
        console.error('Error al cargar lista de divisas', err);
        if (isMounted) {
          setForexList(Object.keys(fallbackData.forex.rates).map(code => ({
            code,
            name: getCurrencyName(code)
          })));
          setUsingFallbackData(true);
          setLoadingForex(false);
        }
      }
    }
    
    fetchForexList();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Cargar imágenes de criptomonedas
  useEffect(() => {
    let isMounted = true;

    async function fetchCoinImages() {
      try {
        const data = await cryptoService.getCoins();
        if (isMounted && data) {
          const images = {};
          data.forEach(coin => {
            images[coin.id] = coin.image;
          });
          setCoinImages(images);
        }
      } catch (err) {
        console.error('Error al cargar imágenes de criptomonedas', err);
        if (isMounted) {
          // Usar datos de fallback
          const images = {};
          fallbackData.crypto.coins.forEach(coin => {
            images[coin.id] = coin.image;
          });
          setCoinImages(images);
          setUsingFallbackData(true);
        }
      }
    }
    
    fetchCoinImages();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Función para obtener el precio actual de una criptomoneda
  const fetchCryptoPrice = async (cryptoId) => {
    if (!cryptoId) return;
    
    try {
      setLoadingPrice(true);
      setErrorMessage(usingFallbackData ? 'Usando datos de ejemplo. CoinGecko API no está disponible en este momento.' : '');
      
      // Usar el servicio de API de criptomonedas
      const data = await cryptoService.getPrices([cryptoId], ['usd']);
      
      if (data && data[cryptoId] && data[cryptoId].usd) {
        setNewAsset(prev => ({
          ...prev,
          purchasePrice: data[cryptoId].usd
        }));
        setUsingFallbackData(false);
      } else {
        setErrorMessage('No se pudo obtener el precio para esta criptomoneda');
      }
    } catch (err) {
      console.error('Error al obtener precio', err);
      
      // Usar precio de fallback
      const fallbackPrices = fallbackData.crypto.getPrices([cryptoId]);
      if (fallbackPrices[cryptoId]) {
        setNewAsset(prev => ({
          ...prev,
          purchasePrice: fallbackPrices[cryptoId].usd
        }));
      }
      
      setUsingFallbackData(true);
      setErrorMessage('Usando datos de ejemplo. CoinGecko API no está disponible en este momento.');
    } finally {
      setLoadingPrice(false);
    }
  };

  // Función para obtener el precio de una acción
  const fetchStockPrice = async (symbol) => {
    if (!symbol) return;
    
    try {
      setLoadingPrice(true);
      setErrorMessage('');
      
      const quote = await stockService.getStockQuote(symbol);
      
      if (quote && quote['Global Quote']) {
        const price = parseFloat(quote['Global Quote']['05. price']);
        setNewAsset(prev => ({
          ...prev,
          purchasePrice: price
        }));
        setUsingFallbackData(false);
      } else {
        throw new Error('No se pudo obtener la cotización');
      }
    } catch (err) {
      console.error('Error al obtener precio de acción', err);
      
      // Usar precio de fallback
      const fallbackQuote = fallbackData.stock.getQuote(symbol);
      setNewAsset(prev => ({
        ...prev,
        purchasePrice: fallbackQuote.price
      }));
      
      setUsingFallbackData(true);
      setErrorMessage('Usando datos de ejemplo. API de acciones no está disponible en este momento.');
    } finally {
      setLoadingPrice(false);
    }
  };

  // Función para obtener el tipo de cambio
  const fetchForexRate = async (symbol) => {
    if (!symbol) return;
    
    try {
      setLoadingPrice(true);
      setErrorMessage('');
      
      const rates = await forexService.getExchangeRates('USD');
      
      if (rates && rates.rates && rates.rates[symbol]) {
        setNewAsset(prev => ({
          ...prev,
          purchasePrice: 1 / rates.rates[symbol] // Convertir a precio en USD
        }));
        setUsingFallbackData(false);
      } else {
        throw new Error('No se pudo obtener el tipo de cambio');
      }
    } catch (err) {
      console.error('Error al obtener tipo de cambio', err);
      
      // Usar tipo de cambio de fallback
      const rate = fallbackData.forex.rates[symbol] || 1;
      setNewAsset(prev => ({
        ...prev,
        purchasePrice: 1 / rate
      }));
      
      setUsingFallbackData(true);
      setErrorMessage('Usando datos de ejemplo. API de tipos de cambio no está disponible en este momento.');
    } finally {
      setLoadingPrice(false);
    }
  };

  // Función para manejar el cambio de símbolo
  const handleSymbolChange = (event, newValue) => {
    if (!newValue) return;
    
    setNewAsset(prev => ({
      ...prev,
      symbol: newValue.id || newValue.symbol || newValue.code
    }));
    
    if (newAsset.type === 'crypto' && newValue.id) {
      fetchCryptoPrice(newValue.id);
    } else if (newAsset.type === 'stock' && newValue.symbol) {
      fetchStockPrice(newValue.symbol);
    } else if (newAsset.type === 'forex' && newValue.code) {
      fetchForexRate(newValue.code);
    }
  };

  // Obtener lista de criptomonedas filtrada
  const getCryptoOptions = () => {
    if (newAsset.type !== 'crypto') return [];
    if (coinList.length === 0) return [];
    
    return coinList.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image
    }));
  };

  // Obtener lista de acciones filtrada
  const getStockOptions = () => {
    if (newAsset.type !== 'stock') return [];
    return stockList;
  };

  // Obtener lista de divisas filtrada
  const getForexOptions = () => {
    if (newAsset.type !== 'forex') return [];
    return forexList;
  };

  // Obtener la imagen de una criptomoneda
  const getCoinImage = (coinId) => {
    const coin = coinList.find(c => c.id === coinId);
    return coin?.image || null;
  };

  // Ayudante para obtener el nombre de una acción por su símbolo
  function getStockName(symbol) {
    const stockNames = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla, Inc.'
    };
    return stockNames[symbol] || symbol;
  }

  // Ayudante para obtener el nombre de una divisa por su código
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
      BRL: 'Real brasileño'
    };
    return currencyNames[code] || code;
  }

  // Manejar la creación de un nuevo portfolio
  const handleCreatePortfolio = (portfolioData) => {
    addPortfolio(portfolioData);
  };

  // Manejar la actualización de un portfolio
  const handleUpdatePortfolio = (portfolioData) => {
    updatePortfolio(portfolioData.id, {
      name: portfolioData.name,
      description: portfolioData.description
    });
  };

  // Manejar la selección de portfolio para agregar activo
  const handleSelectPortfolioForAsset = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setIsAddingAsset(true);
  };

  // Calcular el valor total de un portafolio
  const calculatePortfolioValue = (portfolio) => {
    return portfolio.assets.reduce((total, asset) => {
      return total + (asset.amount * asset.purchasePrice);
    }, 0);
  };

  // Función para manejar el cambio en el input de inversión
  const handleInvestmentAmountChange = (e) => {
    const input = e.target.value;
    
    // Permitir solo números, puntos y comas en el input
    if (/^[$,.\d]*$/.test(input)) {
      setFormattedInvestmentAmount(input);
      
      // Convertir el input formateado a número
      const numericValue = parseFormattedNumber(input);
      
      // Actualizar el estado del activo
      if (newAsset.purchasePrice > 0) {
        setNewAsset({
          ...newAsset,
          amount: numericValue / newAsset.purchasePrice
        });
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Head>
        <title>Gestión de Inversiones</title>
        <meta name="description" content="Gestiona tus inversiones y portafolios" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            component={Link} 
            href="/" 
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Gestión de Inversiones
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Saldo disponible</Typography>
              <Typography variant="h5" fontWeight="bold">{formatAmount(balance)}</Typography>
            </Box>
          </Paper>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {user?.name} ({user?.role})
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={logout}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Box>
      </Box>

      {errorMessage && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }} 
          onClose={() => setErrorMessage('')}
          icon={<InfoIcon />}
        >
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Mis Carteras de Inversión
          </Typography>
          <Button 
            onClick={() => setIsAddingPortfolio(true)}
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Nueva Cartera
          </Button>
        </Box>

        {portfolios.length === 0 ? (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No tienes carteras de inversión creadas
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setIsAddingPortfolio(true)}
              startIcon={<AddIcon />}
            >
              Crear mi primera cartera
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {portfolios.map(portfolio => (
              <Grid item xs={12} md={6} key={portfolio.id}>
                <PortfolioCard
                  portfolio={portfolio}
                  onEdit={setEditingPortfolio}
                  onDelete={removePortfolio}
                  onAddAsset={handleSelectPortfolioForAsset}
                  onRemoveAsset={removeAsset}
                  coinImages={coinImages}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {usingFallbackData && (
        <Box sx={{ mb: 4, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2, border: '1px solid #4caf50' }}>
          <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
            Modo Demo Activo
          </Typography>
          <Typography variant="body2">
            La aplicación está funcionando con datos de ejemplo porque algunas APIs no están disponibles.
            Los precios mostrados son aproximados y no representan valores reales del mercado.
          </Typography>
        </Box>
      )}

      {/* Formulario para crear/editar portfolio */}
      <PortfolioForm
        isOpen={isAddingPortfolio || !!editingPortfolio}
        onClose={() => {
          setIsAddingPortfolio(false);
          setEditingPortfolio(null);
        }}
        onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio}
        portfolio={editingPortfolio}
      />

      {/* Formulario para añadir activo */}
      <AssetForm
        isOpen={isAddingAsset && !!selectedPortfolio}
        onClose={() => {
          setIsAddingAsset(false);
          setSelectedPortfolio(null);
          setErrorMessage('');
        }}
        onAddAsset={addAsset}
        selectedPortfolio={selectedPortfolio}
        balance={balance}
      />
    </Container>
  );
} 