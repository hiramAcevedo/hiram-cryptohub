// components/CoinCard.js
import { Card, CardContent, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function CoinCard({ id, price, onRemove }) {
    return (
        <Card sx={{ minWidth: 200, m: 1 }}>
        <CardContent>
            <Typography variant="h5" gutterBottom>
            {id.charAt(0).toUpperCase() + id.slice(1)}
            </Typography>
            <Typography variant="body2">
            Precio: ${price[id]?.usd ?? '–'}
            </Typography>
            <IconButton onClick={() => onRemove(id)}>
            <DeleteIcon />
            </IconButton>
        </CardContent>
        </Card>
    );
    }
