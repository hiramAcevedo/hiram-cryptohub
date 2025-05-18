/**
 * Formatea un número como moneda con separadores de miles
 * @param {number} value - El valor a formatear
 * @param {number} decimals - Número de decimales a mostrar (por defecto 2)
 * @returns {string} - El valor formateado con separadores de miles
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Formatea un número para mostrar en la UI
 * @param {number} value - El valor a formatear
 * @param {string} prefix - Prefijo ($ por defecto)
 * @param {number} decimals - Número de decimales a mostrar
 * @returns {string} - Cadena formateada (ej: $1,234.56)
 */
export const formatAmount = (value, prefix = '$', decimals = 2) => {
  return `${prefix}${formatCurrency(value, decimals)}`;
};

/**
 * Convierte un valor formateado con comas a número
 * @param {string} formattedValue - El valor formateado (ej: "1,234.56")
 * @returns {number} - El número parseado
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue) return 0;
  // Remover cualquier carácter no numérico excepto punto decimal
  const numericValue = formattedValue.toString().replace(/[^0-9.]/g, '');
  return parseFloat(numericValue);
}; 