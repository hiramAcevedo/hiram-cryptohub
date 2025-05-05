// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography,
  TextField, Button, Autocomplete, Avatar, MenuItem
} from '@mui/material';
import { useWatchlist } from '../store/useWatchlist';
import CoinCard from '../components/CoinCard';

export default function Home() {
  // Estado global
  const { coins, addCoin, removeCoin } = useWatchlist();

  // Lista de todas las monedas para Autocomplete
  const [coinOptions, setCoinOptions] = useState([]);

  // Precios (usd y mxn)
  const [prices, setPrices] = useState({});

  // Posibles errores
  const [error, setError] = useState('');

  // Estado para las divisas
  const [currency, setCurrency] = useState('usd'); 

  const [convertCoin, setConvertCoin] = useState('');
  
  const [convertAmount, setConvertAmount] = useState('');


  // 1) Cargar lista de monedas al montar
  useEffect(() => {
    async function fetchCoinList() {
      try {
        const res = await axios.get(
          'https://api.coingecko.com/api/v3/coins/markets',
          {
            params: {
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: 250,
              page: 1,
              sparkline: false,
            },
          }
        );
        setCoinOptions(res.data);
      } catch (err) {
        console.error('Error fetching coin list', err);
      }
    }
    fetchCoinList();
  }, []);

  // 2) Cargar precios cada vez que cambie `coins`, y repetir cada minuto
  useEffect(() => {
    let intervalId;

    async function fetchPrices() {
      try {
        setError('');
        const ids = coins.join(',');
        const res = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price',
          {
            params: {
              ids,
              vs_currencies: 'usd,mxn',
            },
          }
        );
        setPrices(res.data);
      } catch {
        setError('No se pudieron obtener los precios.');
      }
    }

    fetchPrices();
    intervalId = setInterval(fetchPrices, 60_000); // 60 s
    return () => clearInterval(intervalId);
  }, [coins]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Crypto Watchlist
      </Typography>

      {/* Autocomplete de búsqueda */}
      <Box sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
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
        <Typography variant="body2" color="text.secondary">
          🔍 Selecciona para añadir a tu lista
        </Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
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

      {/* Tarjetas con precios */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {coins.map((id) => (
          <CoinCard
            key={id}
            id={id}
            currency={currency}
            price={prices}
            image={coinOptions.find((c) => c.id === id)?.image}
            onRemove={removeCoin}
          />
        ))}
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
              ? `${(convertAmount * (prices[convertCoin]?.[currency] || 0)).toLocaleString()} ${currency.toUpperCase()}`
              : '–'}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
