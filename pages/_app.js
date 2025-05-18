// pages/_app.js
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../store/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * Tema personalizado para Material-UI con modo oscuro
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4caf50' },
    background: {
      default: '#121212',
      paper: '#1A1A1A'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
});

// Lista de rutas protegidas que requieren autenticación
const protectedRoutes = ['/', '/investments'];

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Hiram CryptoHub</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
          <ProtectedRoute protectedRoutes={protectedRoutes}>
        <Component {...pageProps} />
          </ProtectedRoute>
      </ThemeProvider>
      </AuthProvider>
    </>
  );
}
