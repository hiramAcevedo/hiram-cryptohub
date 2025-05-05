// pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, TextField, Button,
  Box, Typography
} from '@mui/material';
import { useWatchlist } from '../store/useWatchlist';
import CoinCard from '../components/CoinCard';

export default function Home() {
  const { coins, addCoin, removeCoin } = useWatchlist();
  const [newCoin, setNewCoin] = useState('');
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');

  // Efecto: cada vez que cambie la lista de coins, volvemos a consultar precios
  useEffect(() => {
    async function fetchPrices() {
      try {
        setError('');
        const ids = coins.join(',');
        const res = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        setPrices(res.data);
      } catch {
        setError('No se pudieron obtener los precios.');
      }
    }
    fetchPrices();
  }, [coins]);

  const handleAdd = () => {
    const id = newCoin.trim().toLowerCase();
    if (id) {
      addCoin(id);
      setNewCoin('');
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Crypto Watchlist
      </Typography>

      <Box sx={{ display: 'flex', mb: 2 }}>
        <TextField
          label="ID de criptomoneda"
          size="small"
          value={newCoin}
          onChange={(e) => setNewCoin(e.target.value)}
          sx={{ mr: 1 }}
        />
        <Button variant="contained" onClick={handleAdd}>
          Agregar
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

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
