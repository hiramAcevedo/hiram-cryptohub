/**
 * Servicio de Caché para API
 * 
 * Este servicio proporciona funcionalidad para almacenar datos de APIs
 * en caché por un período de tiempo definido para evitar alcanzar
 * límites de peticiones API y mejorar el rendimiento.
 * 
 * El sistema implementa una caché de dos niveles:
 * 1. Caché en memoria para acceso rápido durante la sesión actual
 * 2. Caché persistente usando localStorage para mantener datos entre sesiones
 */

// La estructura de la caché: { key: { data: any, timestamp: number, expiresAt: number } }
let cache = {};

// Duración por defecto de la caché en minutos (300 minutos = 5 horas)
// Este valor fue elegido considerando los límites de Alpha Vantage API
const DEFAULT_CACHE_DURATION = 300;

/**
 * Guarda datos en la caché con una clave única
 * 
 * Este método implementa el equivalente a una operación CREATE/UPDATE en un sistema CRUD
 * para los datos de caché, almacenando tanto en memoria como en localStorage.
 * 
 * @param {string} key - Clave única para identificar los datos
 * @param {any} data - Datos a almacenar
 * @param {number} durationMinutes - Duración en minutos (por defecto 300 minutos)
 * @returns {boolean} - True si se guardó correctamente, false en caso contrario
 */
export const setCacheData = (key, data, durationMinutes = DEFAULT_CACHE_DURATION) => {
  if (!key || data === undefined) return false;
  
  // Crear objeto de caché con metadatos
  cache[key] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + (durationMinutes * 60 * 1000)
  };
  
  // Intentar almacenar en localStorage para persistencia entre sesiones
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cacheItem = JSON.stringify(cache[key]);
      localStorage.setItem(`api_cache_${key}`, cacheItem);
    }
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
  
  return true;
};

/**
 * Obtiene datos de la caché si existen y no han expirado
 * 
 * Este método implementa el equivalente a una operación READ en un sistema CRUD
 * para los datos de caché, verificando primero la memoria y luego localStorage.
 * 
 * @param {string} key - Clave para buscar en la caché
 * @returns {any|null} - Datos almacenados o null si no existen o expiraron
 */
export const getCacheData = (key) => {
  // Primero intentar recuperar de caché en memoria (más rápido)
  let cacheItem = cache[key];
  
  // Si no está en memoria, intentar recuperar de localStorage
  if (!cacheItem && typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedItem = localStorage.getItem(`api_cache_${key}`);
      if (storedItem) {
        cacheItem = JSON.parse(storedItem);
        cache[key] = cacheItem; // Restaurar a caché en memoria
      }
    } catch (error) {
      console.error('Error al recuperar de localStorage:', error);
    }
  }
  
  if (!cacheItem) return null;
  
  // Verificar si los datos han expirado
  if (Date.now() > cacheItem.expiresAt) {
    // Eliminar datos expirados (DELETE)
    delete cache[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`api_cache_${key}`);
      } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
      }
    }
    return null;
  }
  
  return cacheItem.data;
};

/**
 * Comprueba si existe caché válida para una clave
 * 
 * Útil para verificar disponibilidad de datos sin recuperarlos,
 * por ejemplo para mostrar indicadores visuales de caché.
 * 
 * @param {string} key - Clave a verificar
 * @returns {boolean} - True si existe caché válida
 */
export const hasCacheData = (key) => {
  return getCacheData(key) !== null;
};

/**
 * Limpia toda la caché o un elemento específico
 * 
 * Este método implementa el equivalente a una operación DELETE en un sistema CRUD
 * para los datos de caché, eliminando tanto de memoria como de localStorage.
 * 
 * @param {string|null} key - Clave específica o null para limpiar todo
 */
export const clearCache = (key = null) => {
  if (key) {
    // Eliminar un elemento específico
    delete cache[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`api_cache_${key}`);
      } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
      }
    }
  } else {
    // Eliminar toda la caché
    cache = {};
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Eliminar solo las claves que empiezan con api_cache_
        Object.keys(localStorage)
          .filter(key => key.startsWith('api_cache_'))
          .forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error('Error al limpiar localStorage:', error);
      }
    }
  }
};

/**
 * Genera una clave de caché basada en el endpoint y parámetros
 *
 * Crea una clave única y consistente para almacenar y recuperar
 * los datos en caché basada en los parámetros de la petición.
 *
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} params - Parámetros de la petición
 * @returns {string} - Clave única para la caché
 */
export const generateCacheKey = (endpoint, params = {}) => {
  // Ordenar parámetros para garantizar consistencia
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});
  
  return `${endpoint}_${JSON.stringify(sortedParams)}`;
};

/**
 * Obtiene el tiempo restante de validez de la caché en minutos
 * 
 * Útil para mostrar información al usuario sobre cuánto tiempo
 * quedan los datos en caché antes de actualizarse.
 * 
 * @param {string} key - Clave de caché
 * @returns {number} - Minutos restantes o 0 si no hay caché
 */
export const getCacheTimeRemaining = (key) => {
  const cacheItem = cache[key];
  
  if (!cacheItem || Date.now() > cacheItem.expiresAt) {
    return 0;
  }
  
  return Math.floor((cacheItem.expiresAt - Date.now()) / (60 * 1000));
}; 