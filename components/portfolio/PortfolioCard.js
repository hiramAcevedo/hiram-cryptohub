import { useState } from 'react';
import {
  Card, CardContent, CardActions, Typography, Box,
  Divider, IconButton, Button, Avatar, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { formatAmount, formatCurrency } from '../../utils/formatCurrency';

// Iconos para identificar el tipo de activo
const assetTypeIcons = {
  crypto: '₿',
  stock: '📈',
  forex: '💱'
};

/**
 * Componente de tarjeta de cartera que muestra información y permite acciones CRUD
 * Implementa principalmente la operación READ del CRUD y botones para el resto de operaciones
 */
const PortfolioCard = ({
  portfolio,
  onEdit,        // Función para UPDATE de cartera
  onDelete,      // Función para DELETE de cartera
  onAddAsset,    // Función para CREATE de activo
  onRemoveAsset, // Función para DELETE de activo
  coinImages = {}
}) => {
  /**
   * READ: Calcula el valor total de los activos en la cartera
   * @returns {number} Valor total de la cartera
   */
  const calculatePortfolioValue = () => {
    return portfolio.assets.reduce((total, asset) => {
      return total + (asset.amount * asset.purchasePrice);
    }, 0);
  };

  /**
   * READ: Obtiene la imagen para un activo de tipo cripto
   * @param {Object} asset - Activo para el que se quiere obtener la imagen
   * @returns {string|null} URL de la imagen o null si no existe
   */
  const getAssetImage = (asset) => {
    if (asset.type === 'crypto' && coinImages[asset.symbol]) {
      return coinImages[asset.symbol];
    }
    return null;
  };

  // Obtener el nombre formateado para el tipo de activo
  const getAssetTypeLabel = (type) => {
    const labels = {
      crypto: 'Cripto',
      stock: 'Acción',
      forex: 'Divisa'
    };
    return labels[type] || type;
  };

  // Determinar color para el chip según el tipo de activo
  const getAssetTypeColor = (type) => {
    const colors = {
      crypto: 'primary',
      stock: 'success',
      forex: 'secondary'
    };
    return colors[type] || 'default';
  };

  return (
    <Card elevation={3}>
      <CardContent>
        {/* Encabezado con nombre y botones de acción CRUD */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
            {portfolio.name}
          </Typography>
          <Box>
            {/* Botón de editar (UPDATE) */}
            <IconButton 
              size="small" 
              onClick={() => onEdit(portfolio)}
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {/* Botón de eliminar (DELETE) */}
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(portfolio.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {portfolio.description && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {portfolio.description}
          </Typography>
        )}
        
        {/* Información general de la cartera (READ) */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Valor total</Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatAmount(calculatePortfolioValue())}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Activos</Typography>
            <Typography variant="h6" fontWeight="bold">
              {portfolio.assets.length}
            </Typography>
          </Box>
        </Box>
        
        {/* Lista de activos en la cartera (READ) */}
        {portfolio.assets.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Activos en cartera:
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {portfolio.assets.map(asset => (
                <Box 
                  key={asset.id} 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getAssetImage(asset) ? (
                      <Avatar 
                        src={getAssetImage(asset)} 
                        alt={asset.symbol}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                    ) : (
                      <Box sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}>
                        {assetTypeIcons[asset.type] || '•'}
                      </Box>
                    )}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {asset.symbol}
                        </Typography>
                        <Chip 
                          label={getAssetTypeLabel(asset.type)}
                          size="small"
                          color={getAssetTypeColor(asset.type)}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(asset.amount, 8)} × {formatAmount(asset.purchasePrice)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 2 }} fontWeight="medium">
                      {formatAmount(asset.amount * asset.purchasePrice)}
                    </Typography>
                    {/* Botón de vender activo (DELETE) */}
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => onRemoveAsset(portfolio.id, asset.id)}
                    >
                      Vender
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>
      <CardActions>
        {/* Botón para añadir nuevo activo (CREATE) */}
        <Button 
          size="small" 
          onClick={() => onAddAsset(portfolio)}
          startIcon={<AddIcon />}
          sx={{ ml: 1 }}
        >
          Añadir Activo
        </Button>
      </CardActions>
    </Card>
  );
};

export default PortfolioCard; 