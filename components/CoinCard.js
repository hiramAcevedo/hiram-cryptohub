// components/CoinCard.js
import { Card, CardContent, Typography, IconButton, Avatar, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CoinCard({ id, price, currency, image, onRemove }) {
    return (
        <Card sx={{ minWidth: 200, m: 1 }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={image} alt={id} sx={{ width: 24, height: 24, mr: 1 }} />
                <Typography variant="h6">
                {id.charAt(0).toUpperCase() + id.slice(1)}
                </Typography>
            </Box>
            <IconButton onClick={() => onRemove(id)}>
                <DeleteIcon />
            </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
            {currency.toUpperCase()}: ${price[id]?.[currency]?.toLocaleString() ?? '–'}
            </Typography>
        </CardContent>
        </Card>
    );
    }

