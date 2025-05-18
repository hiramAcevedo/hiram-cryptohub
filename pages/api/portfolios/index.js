// API para listar todos los portafolios y crear nuevos
export default function handler(req, res) {
  // Este endpoint se maneja en el lado del cliente con Zustand
  // ya que Next.js no tiene estado persistente entre solicitudes API
  // En un proyecto real, aquí conectaríamos con una base de datos

  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'Para obtener portafolios, usa el store del cliente' 
    });
  } else if (req.method === 'POST') {
    res.status(200).json({ 
      message: 'Para crear portafolios, usa el store del cliente' 
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 