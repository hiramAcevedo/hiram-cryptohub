import { useState } from 'react';
import {
  Box, TextField, Button, MenuItem, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, InputAdornment, Chip, CircularProgress, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { formatAmount, parseFormattedNumber } from '../../utils/formatCurrency';
import CryptoAssets from '../assets/CryptoAssets';
import StockAssets from '../assets/StockAssets';
import ForexAssets from '../assets/ForexAssets';
import { cryptoService, stockService, forexService, fallbackData } from '../../utils/apiServices';

// Función para obtener el nombre de una moneda a partir de su código
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
    RUB: 'Rublo ruso',
    INR: 'Rupia india',
    ZAR: 'Rand sudafricano',
    TRY: 'Lira turca',
    KRW: 'Won surcoreano',
    ILS: 'Séquel israelí',
    SEK: 'Corona sueca',
    NOK: 'Corona noruega',
    DKK: 'Corona danesa',
    HKD: 'Dólar de Hong Kong',
    SGD: 'Dólar de Singapur',
    NZD: 'Dólar neozelandés',
    THB: 'Baht tailandés'
  };
  
  return currencyNames[code] || code;
}

/**
 * Componente de formulario para añadir nuevos activos a una cartera
 * Implementa la operación CREATE del CRUD para activos financieros
 */
const AssetForm = ({
  isOpen,
  onClose,
  onAddAsset, // Función para implementar CREATE del CRUD
  selectedPortfolio,
  balance
}) => {
  const [newAsset, setNewAsset] = useState({
    type: 'crypto',
    symbol: '',
    amount: 0,
    purchasePrice: 0
  });
  
  const [formattedInvestmentAmount, setFormattedInvestmentAmount] = useState('');
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  /**
   * READ: Obtener el precio actual de una criptomoneda desde la API
   * @param {string} cryptoId - ID de la criptomoneda
   */
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

  /**
   * READ: Obtener el precio actual de una acción desde la API
   * @param {string} symbol - Símbolo de la acción
   */
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

  /**
   * READ: Obtener el tipo de cambio actual desde la API
   * @param {string} symbol - Código de la divisa
   */
  const fetchForexRate = async (symbol) => {
    if (!symbol) return;
    
    try {
      setLoadingPrice(true);
      setErrorMessage('');
      
      const rates = await forexService.getExchangeRates('USD');
      
      if (rates && rates.rates && rates.rates[symbol]) {
        // La tasa de cambio nos dice cuántos "symbol" hay por 1 USD
        const exchangeRate = rates.rates[symbol];
        
        // Invertimos la tasa para saber cuánto vale 1 unidad de "symbol" en USD
        const priceInUSD = 1 / exchangeRate;
        
        setNewAsset(prev => ({
          ...prev,
          purchasePrice: priceInUSD
        }));
        
        // Solo mostrar información crítica en los mensajes de información
        if (usingFallbackData) {
          setErrorMessage('Usando datos de ejemplo para conversión de divisas. El tipo de cambio puede no ser el actual.');
        } else {
          setErrorMessage(''); // No mostrar mensaje para no sobrecargar la interfaz
        }
        
        setUsingFallbackData(false);
      } else {
        throw new Error('No se pudo obtener el tipo de cambio');
      }
    } catch (err) {
      console.error('Error al obtener tipo de cambio', err);
      
      // Usar tipo de cambio de fallback
      const rate = fallbackData.forex.rates[symbol] || 1;
      const priceInUSD = 1 / rate;
      
      setNewAsset(prev => ({
        ...prev,
        purchasePrice: priceInUSD
      }));
      
      setUsingFallbackData(true);
      setErrorMessage('Usando datos de ejemplo para conversión de divisas. El tipo de cambio puede no ser el actual.');
    } finally {
      setLoadingPrice(false);
    }
  };

  // Función para manejar el cambio de símbolo
  const handleSymbolChange = (event, newValue) => {
    if (!newValue) return;
    
    // Identificar correctamente el símbolo según el tipo de activo
    let symbol = '';
    if (newAsset.type === 'crypto' && newValue.id) {
      symbol = newValue.id;
    } else if (newAsset.type === 'stock' && newValue.symbol) {
      symbol = newValue.symbol;
    } else if (newAsset.type === 'forex' && newValue.code) {
      symbol = newValue.code;
    } else {
      // Si no podemos determinar el símbolo, usamos la propiedad más probable
      symbol = newValue.id || newValue.symbol || newValue.code || '';
    }
    
    setNewAsset(prev => ({
      ...prev,
      symbol
    }));
    
    console.log(`Seleccionado: ${symbol} de tipo ${newAsset.type}`);
    
    // Obtener precios según el tipo de activo
    if (newAsset.type === 'crypto' && symbol) {
      fetchCryptoPrice(symbol);
    } else if (newAsset.type === 'stock' && symbol) {
      fetchStockPrice(symbol);
    } else if (newAsset.type === 'forex' && symbol) {
      fetchForexRate(symbol);
    }
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

  /**
   * CREATE: Función para crear un nuevo activo y añadirlo a la cartera
   * Implementa la operación CREATE del CRUD
   */
  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!selectedPortfolio || !newAsset.symbol || newAsset.amount <= 0 || newAsset.purchasePrice <= 0) return;
    
    // Verificar si hay suficiente saldo
    const totalCost = newAsset.amount * newAsset.purchasePrice;
    if (totalCost > balance) {
      setErrorMessage('No tienes suficiente saldo para realizar esta compra');
      return;
    }
    
    // Llamar a la función CREATE del store
    onAddAsset(selectedPortfolio.id, newAsset);
    
    // Resetear el formulario
    setNewAsset({ type: 'crypto', symbol: '', amount: 0, purchasePrice: 0 });
    setFormattedInvestmentAmount('');
    setErrorMessage('');
    onClose();
  };

  // Renderizar el selector de activos según el tipo
  const renderAssetSelector = () => {
    switch (newAsset.type) {
      case 'crypto':
        return (
          <CryptoAssets
            onSymbolChange={handleSymbolChange}
            usingFallbackData={usingFallbackData}
            setErrorMessage={setErrorMessage}
            setUsingFallbackData={setUsingFallbackData}
          />
        );
      case 'stock':
        return (
          <StockAssets
            onSymbolChange={handleSymbolChange}
            loadingPrice={loadingPrice}
            usingFallbackData={usingFallbackData}
            setErrorMessage={setErrorMessage}
            setUsingFallbackData={setUsingFallbackData}
          />
        );
      case 'forex':
        return (
          <ForexAssets
            onSymbolChange={handleSymbolChange}
            usingFallbackData={usingFallbackData}
            setErrorMessage={setErrorMessage}
            setUsingFallbackData={setUsingFallbackData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      {selectedPortfolio && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Añadir Activo a {selectedPortfolio.name}</Typography>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <form onSubmit={handleAddAsset}>
            <DialogContent dividers>
              {errorMessage && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 2 }}
                  icon={<InfoIcon />}
                >
                  {errorMessage}
                </Alert>
              )}
              
              <TextField
                select
                label="Tipo de Activo"
                fullWidth
                margin="normal"
                value={newAsset.type}
                onChange={(e) => setNewAsset({...newAsset, type: e.target.value, symbol: '', purchasePrice: 0})}
              >
                <MenuItem value="crypto">Criptomoneda</MenuItem>
                <MenuItem value="stock">Acción</MenuItem>
                <MenuItem value="forex">Divisa</MenuItem>
              </TextField>
              
              {renderAssetSelector()}
              
              <TextField
                label="Cantidad en USD a invertir"
                fullWidth
                margin="normal"
                value={formattedInvestmentAmount}
                onChange={handleInvestmentAmountChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: loadingPrice && <CircularProgress size={20} />
                }}
                placeholder="0.00"
                disabled={loadingPrice}
                required
              />

              {newAsset.type === 'crypto' && newAsset.purchasePrice > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Con esta inversión obtendrás aproximadamente {newAsset.amount.toFixed(8)} {newAsset.symbol}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Precio actual: {formatAmount(newAsset.purchasePrice)} por unidad
                  </Typography>
                </Box>
              )}
              
              {newAsset.type === 'forex' && newAsset.purchasePrice > 0 && (
                <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Resumen de conversión:
                  </Typography>
                  <Typography variant="body2">
                    <strong>${parseFormattedNumber(formattedInvestmentAmount).toFixed(2)} USD</strong> = <strong>{(newAsset.amount).toFixed(2)} {newAsset.symbol}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {getCurrencyName(newAsset.symbol)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo de cambio: 1 {newAsset.symbol} = {formatAmount(newAsset.purchasePrice)}
                  </Typography>
                  {newAsset.symbol !== 'USD' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      1 USD = {(1/newAsset.purchasePrice).toFixed(4)} {newAsset.symbol}
                    </Typography>
                  )}
                </Box>
              )}
              
              {newAsset.type === 'stock' && newAsset.purchasePrice > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Con esta inversión obtendrás aproximadamente {newAsset.amount.toFixed(4)} acciones de {newAsset.symbol}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Precio actual: {formatAmount(newAsset.purchasePrice)} por acción
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`Saldo disponible: ${formatAmount(balance)}`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Typography variant="h6" fontWeight="bold">
                  Total: {formatAmount(newAsset.amount * newAsset.purchasePrice)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained"
                disabled={loadingPrice || 
                  !newAsset.symbol || 
                  (newAsset.amount * newAsset.purchasePrice) <= 0 || 
                  (newAsset.amount * newAsset.purchasePrice) > balance}
              >
                Comprar
              </Button>
            </DialogActions>
          </form>
        </>
      )}
    </Dialog>
  );
};

export default AssetForm; 