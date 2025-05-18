import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, Paper, List, 
  ListItem, ListItemText, Divider, Grid, Card, 
  CardContent, CardActions, Alert, TextField,
  Switch, FormControlLabel, IconButton, Tooltip,
  Snackbar, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import BugReportIcon from '@mui/icons-material/BugReport';
import SpeedIcon from '@mui/icons-material/Speed';
import BarChartIcon from '@mui/icons-material/BarChart';
import CachedIcon from '@mui/icons-material/Cached';
import KeyIcon from '@mui/icons-material/Key';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BugIcon from '@mui/icons-material/BugReport';
import { clearCache, getCacheData, hasCacheData, getCacheTimeRemaining } from '../utils/cacheService';
import { cryptoService, stockService, forexService } from '../utils/apiServices';
import { useAuth } from '../store/AuthContext';

export default function AdminPage() {
  const [cacheStats, setCacheStats] = useState({ count: 0, items: [] });
  const [testApiStatus, setTestApiStatus] = useState({
    crypto: { status: 'unknown', message: 'No probado' },
    stock: { status: 'unknown', message: 'No probado' },
    forex: { status: 'unknown', message: 'No probado' }
  });
  const [customClearKey, setCustomClearKey] = useState('');
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    alphavantage: '',
    exchangerate: ''
  });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Nueva estado para prueba directa
  const [directTestStatus, setDirectTestStatus] = useState({
    loading: false,
    result: null,
    error: null
  });

  // Cargar estadísticas de caché
  useEffect(() => {
    loadCacheStats();
    
    // Actualizar cada 30 segundos
    const intervalId = setInterval(loadCacheStats, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Cargar claves API almacenadas en sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAlphaKey = sessionStorage.getItem('api_key_alphavantage');
      const storedExchangeKey = sessionStorage.getItem('api_key_exchangerate');
      
      setApiKeys({
        alphavantage: storedAlphaKey || '',
        exchangerate: storedExchangeKey || ''
      });
    }
  }, []);

  // Función para cargar estadísticas de caché desde localStorage
  const loadCacheStats = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Buscar todas las claves de caché en localStorage
      const cacheItems = [];
      let count = 0;
      
      // Iterar sobre localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('api_cache_')) {
          count++;
          // Extraer la clave real (sin el prefijo)
          const realKey = key.replace('api_cache_', '');
          const timeRemaining = getCacheTimeRemaining(realKey);
          
          try {
            const storageItem = localStorage.getItem(key);
            if (storageItem) {
              const cachedItem = JSON.parse(storageItem);
              cacheItems.push({
                key: realKey,
                timeRemaining,
                expiresAt: new Date(cachedItem.expiresAt).toLocaleString(),
                dataSize: JSON.stringify(cachedItem.data).length
              });
            }
          } catch (e) {
            console.error(`Error al procesar el elemento de caché ${key}:`, e);
          }
        }
      }
      
      // Ordenar por tiempo restante (ascendente)
      cacheItems.sort((a, b) => a.timeRemaining - b.timeRemaining);
      
      setCacheStats({
        count,
        items: cacheItems
      });
    } catch (error) {
      console.error('Error al cargar estadísticas de caché:', error);
    }
  };

  // Probar APIs
  const testApi = async (apiType) => {
    setTestApiStatus(prev => ({
      ...prev,
      [apiType]: { status: 'loading', message: 'Probando conexión...' }
    }));
    
    try {
      let result;
      
      switch (apiType) {
        case 'crypto':
          result = await cryptoService.getCoins();
          if (result && Array.isArray(result) && result.length > 0) {
            setTestApiStatus(prev => ({
              ...prev,
              crypto: { 
                status: 'success', 
                message: `Conexión exitosa. Obtuvo ${result.length} monedas.` 
              }
            }));
          } else {
            throw new Error('Formato de respuesta inesperado');
          }
          break;
          
        case 'stock':
          // Verificar si hay una clave API configurada
          const alphaKey = apiKeys.alphavantage || sessionStorage.getItem('api_key_alphavantage');
          if (!alphaKey || alphaKey === 'demo') {
            setTestApiStatus(prev => ({
              ...prev,
              stock: { 
                status: 'warning', 
                message: `Usando clave demo. Para acceso completo ingresa tu propia clave API en el panel superior.` 
              }
            }));
            return;
          }
          
          result = await stockService.getStockQuote('MSFT');
          
          // Verificar respuestas específicas de Alpha Vantage
          if (result && result.Note && result.Note.includes('API call frequency')) {
            setTestApiStatus(prev => ({
              ...prev,
              stock: { 
                status: 'error', 
                message: 'Error: Límite de frecuencia excedido. Espera un minuto antes de intentar nuevamente.' 
              }
            }));
            return;
          }
          
          if (result && result['Global Quote'] && Object.keys(result['Global Quote']).length > 0) {
            setTestApiStatus(prev => ({
              ...prev,
              stock: { 
                status: 'success', 
                message: 'Conexión exitosa. Obtuvo datos de MSFT.' 
              }
            }));
          } else {
            throw new Error('Respuesta inválida o vacía de Alpha Vantage');
          }
          break;
          
        case 'forex':
          // Verificar si hay una clave API configurada
          const exchangeKey = apiKeys.exchangerate || sessionStorage.getItem('api_key_exchangerate');
          if (!exchangeKey) {
            setTestApiStatus(prev => ({
              ...prev,
              forex: { 
                status: 'error', 
                message: 'Error: No hay clave API configurada. Ingresa tu clave en el panel superior.' 
              }
            }));
            return;
          }
          
          result = await forexService.getExchangeRates('USD');
          
          if (result && result.result === 'error') {
            let errorMsg = 'Error desconocido en la API de Exchange Rate';
            
            // Mensajes personalizados según el tipo de error
            if (result['error-type'] === 'invalid-key') {
              errorMsg = 'Clave API inválida. Verifica que hayas ingresado correctamente tu clave.';
            } else if (result['error-type']) {
              errorMsg = `Error: ${result['error-type']}`;
            }
            
            setTestApiStatus(prev => ({
              ...prev,
              forex: { 
                status: 'error', 
                message: errorMsg
              }
            }));
            return;
          }
          
          if (result && result.rates && Object.keys(result.rates).length > 0) {
            setTestApiStatus(prev => ({
              ...prev,
              forex: { 
                status: 'success', 
                message: `Conexión exitosa. Obtuvo ${Object.keys(result.rates).length} tasas.` 
              }
            }));
          } else {
            throw new Error('Formato de respuesta inesperado');
          }
          break;
      }
    } catch (error) {
      console.error(`Error al probar API ${apiType}:`, error);
      
      // Manejo personalizado de errores comunes
      let errorMessage = `Error: ${error.message}`;
      
      if (error.response) {
        // Errores de respuesta HTTP
        const status = error.response.status;
        
        if (status === 401 || status === 403) {
          errorMessage = 'Error: Clave API inválida o sin autorización.';
        } else if (status === 404) {
          errorMessage = 'Error: Recurso no encontrado. Verifica la URL de la API.';
        } else if (status === 429) {
          errorMessage = 'Error: Límite de solicitudes excedido. Espera un momento e intenta nuevamente.';
        } else if (status >= 500) {
          errorMessage = 'Error: Problema con el servidor de la API. Intenta más tarde.';
        }
      } else if (error.request) {
        // No se recibió respuesta
        errorMessage = 'Error: No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      }
      
      setTestApiStatus(prev => ({
        ...prev,
        [apiType]: { 
          status: 'error', 
          message: errorMessage
        }
      }));
    }
  };

  // Limpiar toda la caché
  const handleClearAllCache = () => {
    clearCache();
    loadCacheStats();
  };

  // Limpiar una clave específica
  const handleClearCacheKey = (key) => {
    clearCache(key);
    loadCacheStats();
  };

  // Limpiar caché personalizada
  const handleClearCustomKey = () => {
    if (customClearKey.trim()) {
      clearCache(customClearKey.trim());
      setCustomClearKey('');
      loadCacheStats();
    }
  };

  // Guardar claves API
  const handleSaveApiKeys = () => {
    // Guardar en sessionStorage (se borra al cerrar el navegador)
    if (apiKeys.alphavantage) {
      sessionStorage.setItem('api_key_alphavantage', apiKeys.alphavantage);
    } else {
      sessionStorage.removeItem('api_key_alphavantage');
    }
    
    if (apiKeys.exchangerate) {
      sessionStorage.setItem('api_key_exchangerate', apiKeys.exchangerate);
    } else {
      sessionStorage.removeItem('api_key_exchangerate');
    }
    
    // Limpiar caché después de cambiar las claves
    clearCache();
    loadCacheStats();
    
    // Mostrar notificación
    setNotification({
      open: true,
      message: 'Claves API guardadas. La caché se ha limpiado para usar las nuevas claves.',
      severity: 'success'
    });
    
    // Recargar la página para que los cambios surtan efecto
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Borrar claves API
  const handleClearApiKeys = () => {
    sessionStorage.removeItem('api_key_alphavantage');
    sessionStorage.removeItem('api_key_exchangerate');
    
    setApiKeys({
      alphavantage: '',
      exchangerate: ''
    });
    
    // Limpiar caché después de eliminar las claves
    clearCache();
    loadCacheStats();
    
    // Mostrar notificación
    setNotification({
      open: true,
      message: 'Claves API eliminadas. Se usarán las claves por defecto.',
      severity: 'info'
    });
    
    // Recargar la página para que los cambios surtan efecto
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Copiar al portapapeles
  const handleCopyToClipboard = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      setNotification({
        open: true,
        message: 'Copiado al portapapeles',
        severity: 'success'
      });
    });
  };

  // Cerrar notificación
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  // Nueva función para probar una URL específica de Exchange Rate API
  const testExchangeRateDirectly = async () => {
    const specificUrl = 'https://v6.exchangerate-api.com/v6/61c8436d6e70db4edaa697bf/latest/USD';
    
    setDirectTestStatus({
      loading: true,
      result: null,
      error: null
    });
    
    try {
      // Intentar con la URL específica
      const response = await axios.get(specificUrl, {
        timeout: 15000
      });
      
      setDirectTestStatus({
        loading: false,
        result: response.data,
        error: null
      });
    } catch (error) {
      console.error('Error en prueba directa:', error);
      
      let errorDetails = {
        message: error.message,
        code: error.code || 'UNKNOWN',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: specificUrl
      };
      
      setDirectTestStatus({
        loading: false,
        result: null,
        error: errorDetails
      });
    }
  };

  return (
    <>
      <Head>
        <title>Administración - Crypto Watchlist</title>
      </Head>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Panel de Administración
        </Typography>
        
        <Grid container spacing={3}>
          {/* Panel de configuración de claves API */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <KeyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Configuración de claves API personalizadas
                  <Tooltip title="Las claves se almacenan únicamente en tu navegador y se borran al cerrar la sesión. No se envían a ningún servidor.">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Ingresa tus propias claves API para usar los servicios con tu cuenta. Las claves se guardan solo en este navegador
                  y se eliminan al cerrar la sesión. No compartimos esta información con ningún servidor.
                </Alert>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Alpha Vantage API Key"
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      value={apiKeys.alphavantage}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, alphavantage: e.target.value }))}
                      type={showApiKeys ? "text" : "password"}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => handleCopyToClipboard(apiKeys.alphavantage)} edge="end">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Exchange Rate API Key"
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      value={apiKeys.exchangerate}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, exchangerate: e.target.value }))}
                      type={showApiKeys ? "text" : "password"}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => handleCopyToClipboard(apiKeys.exchangerate)} edge="end">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showApiKeys}
                        onChange={(e) => setShowApiKeys(e.target.checked)}
                      />
                    }
                    label="Mostrar claves"
                  />
                  
                  <Box>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveApiKeys}
                      sx={{ mr: 1 }}
                      disabled={!apiKeys.alphavantage && !apiKeys.exchangerate}
                    >
                      Guardar Claves
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleClearApiKeys}
                      disabled={!apiKeys.alphavantage && !apiKeys.exchangerate}
                    >
                      Borrar Claves
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Panel de estadísticas de caché */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CachedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Gestión de Caché
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper', textAlign: 'center' }}>
                      <Typography variant="h3">{cacheStats.count}</Typography>
                      <Typography variant="body1">Elementos en caché</Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={8}>
                    <CardActions>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<RefreshIcon />}
                        onClick={loadCacheStats}
                      >
                        Actualizar estadísticas
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={handleClearAllCache}
                      >
                        Limpiar toda la caché
                      </Button>
                    </CardActions>
                    
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end' }}>
                      <TextField
                        label="Clave de caché personalizada"
                        value={customClearKey}
                        onChange={(e) => setCustomClearKey(e.target.value)}
                        variant="outlined"
                        size="small"
                        fullWidth
                      />
                      <Button 
                        variant="contained" 
                        color="warning" 
                        startIcon={<DeleteIcon />}
                        onClick={handleClearCustomKey}
                        sx={{ ml: 1 }}
                        disabled={!customClearKey.trim()}
                      >
                        Limpiar
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1">Elementos en caché:</Typography>
                  
                  {cacheStats.items.length > 0 ? (
                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                      <List dense>
                        {cacheStats.items.map((item, index) => (
                          <Box key={item.key || index}>
                            <ListItem 
                              secondaryAction={
                                <Button 
                                  size="small" 
                                  color="error" 
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleClearCacheKey(item.key)}
                                >
                                  Eliminar
                                </Button>
                              }
                            >
                              <ListItemText
                                primary={<Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{item.key}</Typography>}
                                secondary={
                                  <>
                                    <Typography variant="caption" component="span">
                                      Expira: {item.expiresAt} ({item.timeRemaining} minutos restantes) • 
                                      Tamaño: {Math.round(item.dataSize / 1024)} KB
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            {index < cacheStats.items.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </Paper>
                  ) : (
                    <Alert severity="info">No hay elementos en caché actualmente.</Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Panel de prueba de APIs */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BugReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Prueba de APIs
                </Typography>
                
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Las APIs de finanzas suelen requerir claves de pago para un uso completo. 
                  Las claves gratuitas tienen limitaciones considerables.
                </Alert>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">CoinGecko API</Typography>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                        API gratuita con límites de uso
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => testApi('crypto')}
                          disabled={testApiStatus.crypto.status === 'loading'}
                        >
                          Probar conexión
                        </Button>
                      </Box>
                      <Alert 
                        severity={
                          testApiStatus.crypto.status === 'success' ? 'success' : 
                          testApiStatus.crypto.status === 'error' ? 'error' : 'info'
                        }
                        sx={{ mt: 2 }}
                      >
                        {testApiStatus.crypto.message}
                      </Alert>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">Alpha Vantage API</Typography>
                      <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
                        Requiere clave API (limitaciones severas en versión gratuita)
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => testApi('stock')}
                          disabled={testApiStatus.stock.status === 'loading'}
                        >
                          Probar conexión
                        </Button>
                      </Box>
                      <Alert 
                        severity={
                          testApiStatus.stock.status === 'success' ? 'success' : 
                          testApiStatus.stock.status === 'error' ? 'error' : 'info'
                        }
                        sx={{ mt: 2 }}
                      >
                        {testApiStatus.stock.message}
                      </Alert>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        La clave demo tiene límite de 5 llamadas/minuto
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">Exchange Rate API</Typography>
                      <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
                        Requiere clave API personalizada
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => testApi('forex')}
                          disabled={testApiStatus.forex.status === 'loading'}
                        >
                          Probar conexión
                        </Button>
                      </Box>
                      <Alert 
                        severity={
                          testApiStatus.forex.status === 'success' ? 'success' : 
                          testApiStatus.forex.status === 'error' ? 'error' : 'info'
                        }
                        sx={{ mt: 2 }}
                      >
                        {testApiStatus.forex.message}
                      </Alert>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Nueva sección para prueba específica de URL */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BugIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Prueba directa de URL específica (Debugging)
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Esta sección permite probar directamente una URL específica para diagnosticar problemas.
                  Actualmente configurada para probar: <code>https://v6.exchangerate-api.com/v6/61c8436d6e70db4edaa697bf/latest/USD</code>
                </Alert>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button 
                    variant="contained" 
                    color="warning" 
                    onClick={testExchangeRateDirectly}
                    disabled={directTestStatus.loading}
                    startIcon={directTestStatus.loading ? <CircularProgress size={24} /> : <BugReportIcon />}
                  >
                    Probar URL específica de Exchange Rate API
                  </Button>
                </Box>
                
                {directTestStatus.loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                )}
                
                {directTestStatus.result && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Respuesta exitosa:</Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: 300, 
                        overflow: 'auto',
                        backgroundColor: '#f5f5f5',
                        fontFamily: 'monospace'
                      }}
                    >
                      <pre>{JSON.stringify(directTestStatus.result, null, 2)}</pre>
                    </Paper>
                  </Box>
                )}
                
                {directTestStatus.error && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" color="error" gutterBottom>Error:</Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: 300, 
                        overflow: 'auto',
                        backgroundColor: '#fff8f8',
                        fontFamily: 'monospace'
                      }}
                    >
                      <Typography variant="body2" color="error" gutterBottom>
                        <strong>Mensaje:</strong> {directTestStatus.error.message}
                      </Typography>
                      <Typography variant="body2" color="error" gutterBottom>
                        <strong>Código:</strong> {directTestStatus.error.code}
                      </Typography>
                      <Typography variant="body2" color="error" gutterBottom>
                        <strong>Estado HTTP:</strong> {directTestStatus.error.status || 'N/A'} {directTestStatus.error.statusText || ''}
                      </Typography>
                      <Typography variant="body2" color="error" gutterBottom>
                        <strong>URL:</strong> {directTestStatus.error.url}
                      </Typography>
                      {directTestStatus.error.data && (
                        <>
                          <Typography variant="body2" color="error" gutterBottom>
                            <strong>Datos de respuesta:</strong>
                          </Typography>
                          <pre>{JSON.stringify(directTestStatus.error.data, null, 2)}</pre>
                        </>
                      )}
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          El error 404 generalmente indica que la URL no existe o la clave API ya no es válida. 
                          Trata de obtener una nueva clave API gratuita en: <a href="https://app.exchangerate-api.com/sign-up" target="_blank" rel="noopener noreferrer">ExchangeRate-API</a>
                        </Typography>
                      </Alert>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Información sobre APIs */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Información de APIs y límites
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="CoinGecko API (Criptomonedas)"
                      secondary="Límite gratuito: 10-50 requests/minuto, dependiendo de la carga del servidor. Recomendado mantener caché por al menos 60 minutos."
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Alpha Vantage API (Acciones)
                          <Tooltip title="Obtén tu clave gratuita en: https://www.alphavantage.co/support/#api-key">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Límite gratuito: 5 requests/minuto, 500 requests/día con API key estándar.
                          </Typography>
                          <Typography variant="body2" component="div" color="error.main" sx={{ mt: 0.5 }}>
                            Las claves demo (como la usada por defecto) tienen límites extremadamente estrictos (1 llamada por minuto).
                            Para un uso completo, se recomienda adquirir un plan Premium.
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          Exchange Rate API (Forex)
                          <Tooltip title="Obtén tu clave gratuita en: https://app.exchangerate-api.com/sign-up">
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Esta API requiere una clave válida para funcionar correctamente. La versión gratuita tiene un límite de 1,500 solicitudes por mes.
                          </Typography>
                          <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                            Recomendado mantener caché por al menos 60 minutos ya que los tipos de cambio no suelen variar significativamente en periodos cortos.
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      
      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </>
  );
} 