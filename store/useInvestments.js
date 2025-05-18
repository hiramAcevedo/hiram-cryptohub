import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para gestión de inversiones
 * Implementa operaciones CRUD para carteras y activos
 */
export const useInvestments = create(
  persist(
    (set) => ({
      balance: 10000, // Saldo inicial de 10,000 dólares
      portfolios: [], // Lista de carteras de inversión
      
      // ===== OPERACIONES CRUD PARA CARTERAS =====
      
      /**
       * CREATE: Agregar una nueva cartera de inversión
       * @param {Object} portfolio - Datos de la cartera a crear
       */
      addPortfolio: (portfolio) => 
        set((state) => ({
          portfolios: [...state.portfolios, {
            id: Date.now().toString(), // ID único basado en timestamp
            name: portfolio.name,
            description: portfolio.description,
            assets: [], // Activos dentro de la cartera
            createdAt: new Date().toISOString(),
          }]
        })),
      
      /**
       * DELETE: Eliminar una cartera existente por su ID
       * @param {string} portfolioId - ID de la cartera a eliminar
       */
      removePortfolio: (portfolioId) =>
        set((state) => ({
          portfolios: state.portfolios.filter(p => p.id !== portfolioId)
        })),
      
      /**
       * UPDATE: Actualizar datos de una cartera existente
       * @param {string} portfolioId - ID de la cartera a actualizar
       * @param {Object} updates - Nuevos datos para la cartera
       */
      updatePortfolio: (portfolioId, updates) =>
        set((state) => ({
          portfolios: state.portfolios.map(p => 
            p.id === portfolioId ? { ...p, ...updates } : p
          )
        })),
      
      // ===== OPERACIONES CRUD PARA ACTIVOS =====
      
      /**
       * CREATE: Agregar un nuevo activo a una cartera
       * @param {string} portfolioId - ID de la cartera donde se añadirá el activo
       * @param {Object} asset - Datos del activo a añadir
       */
      addAsset: (portfolioId, asset) =>
        set((state) => ({
          portfolios: state.portfolios.map(p => 
            p.id === portfolioId 
              ? { 
                  ...p, 
                  assets: [...p.assets, {
                    id: Date.now().toString(),
                    type: asset.type, // 'crypto', 'stock', 'forex'
                    symbol: asset.symbol,
                    amount: asset.amount,
                    purchasePrice: asset.purchasePrice,
                    purchaseDate: new Date().toISOString(),
                  }] 
                } 
              : p
          ),
          // Actualizar el saldo tras la compra
          balance: state.balance - (asset.amount * asset.purchasePrice)
        })),
      
      /**
       * DELETE: Eliminar un activo de una cartera
       * @param {string} portfolioId - ID de la cartera que contiene el activo
       * @param {string} assetId - ID del activo a eliminar
       */
      removeAsset: (portfolioId, assetId) =>
        set((state) => {
          // Encontrar el portfolio
          const portfolio = state.portfolios.find(p => p.id === portfolioId);
          if (!portfolio) return state;
          
          // Encontrar el activo
          const asset = portfolio.assets.find(a => a.id === assetId);
          if (!asset) return state;
          
          return {
            portfolios: state.portfolios.map(p => 
              p.id === portfolioId 
                ? { 
                    ...p, 
                    assets: p.assets.filter(a => a.id !== assetId) 
                  } 
                : p
            ),
            // Devolver el saldo al eliminar un activo (venta)
            balance: state.balance + (asset.amount * asset.purchasePrice)
          };
        }),
      
      /**
       * UPDATE: Actualizar el saldo del usuario
       * @param {number} amount - Cantidad a añadir o restar del saldo
       */
      updateBalance: (amount) =>
        set((state) => ({
          balance: state.balance + amount
        })),
        
      // Nota: La operación READ se realiza implícitamente al acceder
      // al estado desde los componentes que usan este store
    }),
    {
      name: 'investment-storage', // Nombre para localStorage
    }
  )
); 