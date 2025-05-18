import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../store/AuthContext';
import { 
  Container, Box, Typography, TextField, Button, 
  Alert, Grid, Avatar
} from '@mui/material';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const { login, user, loading, DEMO_USERS } = useAuth();
  const router = useRouter();
  const [bitcoinIcon, setBitcoinIcon] = useState('');

  // Cargar icono de Bitcoin desde API
  useEffect(() => {
    // Usamos CoinGecko API para obtener el icono de Bitcoin
    fetch('https://api.coingecko.com/api/v3/coins/bitcoin')
      .then(response => response.json())
      .then(data => {
        setBitcoinIcon(data.image.large);
      })
      .catch(error => {
        console.error('Error al cargar icono de Bitcoin:', error);
        // Fallback a una URL conocida si la API falla
        setBitcoinIcon('https://assets.coingecko.com/coins/images/1/large/bitcoin.png');
      });
  }, []);

  // Si el usuario ya está autenticado, redirigir a la página principal
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const success = login(email, password);
    
    if (success) {
      router.push('/');
    } else {
      setError('Credenciales incorrectas. Por favor, intenta de nuevo.');
    }
  };

  // Establecer credenciales de demo al hacer clic
  const setDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  // Mostrar carga mientras se verifica la autenticación
  if (loading) {
    return (
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}
      >
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 6, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Head>
        <title>Iniciar Sesión - CryptoHub</title>
      </Head>
      
      {/* Avatar de Bitcoin */}
      {bitcoinIcon && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Avatar
            src={bitcoinIcon}
            alt="Bitcoin"
            sx={{ width: 120, height: 120 }}
          />
        </Box>
      )}
      
      <Typography 
        component="h1" 
        variant="h4" 
        sx={{ 
          mb: 2, 
          fontWeight: 400, 
          textAlign: 'center' 
        }}
      >
        CryptoWatchlist Demo
      </Typography>
      
      <Typography 
        variant="subtitle1"
        sx={{ 
          mb: 6, 
          textAlign: 'center',
          color: 'text.secondary'
        }}
      >
        Acceso configurado automáticamente
      </Typography>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        noValidate 
        sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <TextField
          required
          fullWidth
          id="email"
          label="Correo Electrónico"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          variant="outlined"
        />
        
        <TextField
          required
          fullWidth
          name="password"
          label="Contraseña"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          variant="outlined"
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disableElevation
          sx={{ 
            py: 1.5,
            mt: 1,
            fontWeight: 500,
          }}
        >
          Iniciar Sesión
        </Button>
      </Box>

      {/* Recuadro con credenciales de acceso (simplificado para un solo usuario) */}
      <Box 
        sx={{ 
          p: 2, 
          mt: 'auto',
          pt: 4,
          bgcolor: 'rgba(76, 175, 80, 0.1)', 
          borderRadius: 2,
          border: '1px solid #4caf50'
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Credenciales de acceso para demo:
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2">
            <strong>Usuario:</strong> {DEMO_USERS[0].email}
          </Typography>
          <Typography variant="body2">
            <strong>Contraseña:</strong> {DEMO_USERS[0].password}
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            Rol: {DEMO_USERS[0].role}
          </Typography>
          <Button 
            size="small" 
            variant="contained"
            color="primary"
            onClick={() => {
              setEmail(DEMO_USERS[0].email);
              setPassword(DEMO_USERS[0].password);
            }}
            sx={{
              mt: 1,
              mb: 1
            }}
          >
            Completar automáticamente
          </Button>
        </Box>
      </Box>
    </Container>
  );
} 