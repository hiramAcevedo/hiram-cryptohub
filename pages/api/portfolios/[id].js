// API para obtener, actualizar o eliminar un portafolio específico
export default function handler(req, res) {
  // En un proyecto real, aquí conectaríamos con una base de datos
  // pero como usamos Zustand para el estado, estos endpoints son más bien ilustrativos
  
  const { id } = req.query;
  
  if (req.method === 'GET') {
    res.status(200).json({ 
      message: `Para obtener el portafolio ${id}, usa el store del cliente` 
    });
  } else if (req.method === 'PUT') {
    res.status(200).json({ 
      message: `Para actualizar el portafolio ${id}, usa el store del cliente` 
    });
  } else if (req.method === 'DELETE') {
    res.status(200).json({ 
      message: `Para eliminar el portafolio ${id}, usa el store del cliente` 
    });
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 