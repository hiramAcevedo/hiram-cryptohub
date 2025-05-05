// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, Typography,
  TextField, Button, Autocomplete, Avatar
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

      {/* Tarjetas con precios */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {coins.map((id) => (
          <CoinCard
            key={id}
            id={id}
            price={prices}
            onRemove={removeCoin}
          />
        ))}
      </Box>
    </Container>
  );
}
