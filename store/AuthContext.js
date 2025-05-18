import { createContext, useState, useContext, useEffect } from 'react';

// Usuarios predefinidos para demo
const DEMO_USERS = [
  { email: 'admin@example.com', password: 'password', name: 'Admin', role: 'admin' }
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('cryptoUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = (email, password) => {
    const foundUser = DEMO_USERS.find(
      u => u.email === email && u.password === password
    );
    
    if (foundUser) {
      // No incluir la contraseña en el objeto de usuario almacenado
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      // Guardar en localStorage
      localStorage.setItem('cryptoUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('cryptoUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para acceder al contexto
export function useAuth() {
  return useContext(AuthContext);
} 