import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Componente de formulario para crear y editar carteras de inversión
 * Implementa las operaciones CREATE y UPDATE del CRUD para carteras
 */
const PortfolioForm = ({
  isOpen,
  onClose,
  onSubmit, // Función para CREATE o UPDATE según el contexto
  portfolio = null // Si existe, estamos en modo UPDATE; si no, en modo CREATE
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  /**
   * Efecto que carga datos existentes en modo UPDATE o reinicia el formulario en modo CREATE
   * Parte de las operaciones READ y UPDATE del CRUD
   */
  useEffect(() => {
    if (portfolio) {
      // Modo UPDATE: Cargar datos existentes (READ)
      setFormData({
        name: portfolio.name || '',
        description: portfolio.description || ''
      });
    } else {
      // Modo CREATE: Reiniciar formulario
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [portfolio, isOpen]);

  // Manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  /**
   * Maneja el envío del formulario para crear o actualizar una cartera
   * Implementa las operaciones CREATE o UPDATE del CRUD
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    // Si portfolio existe, estamos actualizando (UPDATE); si no, estamos creando (CREATE)
    onSubmit(portfolio ? { ...portfolio, ...formData } : formData);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {portfolio ? 'Editar Cartera' : 'Nueva Cartera de Inversión'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <TextField
            label="Nombre"
            name="name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            label="Descripción"
            name="description"
            fullWidth
            margin="normal"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            {portfolio ? 'Guardar Cambios' : 'Crear Cartera'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PortfolioForm; 