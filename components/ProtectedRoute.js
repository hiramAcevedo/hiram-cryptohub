import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../store/AuthContext';
import { Box, CircularProgress, Typography, Paper, Fade } from '@mui/material';

export default function ProtectedRoute({ children, protectedRoutes }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está cargando y el usuario no está autenticado
    // y la ruta actual está en la lista de rutas protegidas
    if (!loading && !user && protectedRoutes.includes(router.pathname)) {
      // Redirigir a la página de login
      router.push('/login');
    }
  }, [loading, user, router, protectedRoutes]);

  // Mostrar un spinner mientras se carga
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Fade in={true} style={{ transitionDelay: '200ms' }}>
          <Paper 
            elevation={1} 
            sx={{ 
              py: 4, 
              px: 5, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              maxWidth: 260
            }}
          >
            <CircularProgress 
              size={48} 
              thickness={3} 
              sx={{ mb: 2 }} 
            />
            <Typography variant="body1" fontWeight={400}>
              Cargando...
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  // Si no está en una ruta protegida o el usuario está autenticado, mostrar el contenido
  if (!protectedRoutes.includes(router.pathname) || user) {
    return <>{children}</>;
  }

  // Si está en una ruta protegida, no está cargando, y no hay usuario autenticado,
  // no mostrar nada (la redirección se manejará en el useEffect)
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress />
    </Box>
  );
} 